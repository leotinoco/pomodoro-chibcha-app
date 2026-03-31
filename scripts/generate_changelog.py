import os
import re
import subprocess
import datetime
from collections import defaultdict

def run_command(command):
    try:
        result = subprocess.check_output(command, stderr=subprocess.STDOUT, shell=True)
        return result.decode('utf-8').strip()
    except subprocess.CalledProcessError as e:
        return ""

def get_latest_tag():
    try:
        tag = run_command("git describe --tags --abbrev=0")
        return tag
    except:
        return ""

def get_commits_since(tag):
    if tag:
        range_spec = f"{tag}..HEAD"
    else:
        range_spec = "HEAD"
    
    # Format: hash|subject|body
    log_output = run_command(f'git log {range_spec} --pretty=format:"%H|%s|%b<ENDCommit>"')
    return log_output.split("<ENDCommit>")

def parse_commit(commit_str):
    parts = commit_str.strip().split("|", 2)
    if len(parts) < 2:
        return None
    
    commit_hash = parts[0]
    subject = parts[1]
    body = parts[2] if len(parts) > 2 else ""
    
    # Conventional Commits Regex (modified to ignore leading emojis/symbols)
    # matches: [optional emoji/trash] type(scope): description
    match = re.match(r"^[\W_]*(\w+)(?:\(([^)]+)\))?(!?):\s(.+)$", subject)
    
    if match:
        c_type = match.group(1)
        c_scope = match.group(2)
        c_breaking = match.group(3) == "!"
        c_desc = match.group(4)
        
        is_breaking = c_breaking or "BREAKING CHANGE" in body
        
        return {
            "type": c_type,
            "scope": c_scope,
            "breaking": is_breaking,
            "description": c_desc,
            "hash": commit_hash
        }
    return None

def determine_version_bump(commits):
    major = False
    minor = False
    patch = False
    
    for commit in commits:
        if not commit: continue
        if commit['breaking']:
            major = True
        elif commit['type'] == 'feat':
            minor = True
        elif commit['type'] == 'fix':
            patch = True
            
    if major: return "major"
    if minor: return "minor"
    if patch: return "patch"
    return "patch" # Default to patch if only chores/docs

def increment_version(version, bump_type):
    # Remove 'v' prefix if present
    v_str = version.lstrip('v')
    if not v_str:
        return "0.1.0" # Default start
        
    parts = list(map(int, v_str.split('.')))
    
    if bump_type == "major":
        parts[0] += 1
        parts[1] = 0
        parts[2] = 0
    elif bump_type == "minor":
        parts[1] += 1
        parts[2] = 0
    elif bump_type == "patch":
        parts[2] += 1
        
    return f"{parts[0]}.{parts[1]}.{parts[2]}"

def translate_type(c_type):
    mapping = {
        "feat": "🚀 Nuevas Características",
        "fix": "🐛 Correcciones",
        "docs": "📚 Documentación",
        "style": "🎨 Estilo Visual",
        "refactor": "🛠 Mejoras Internas",
        "perf": "⚡ Rendimiento",
        "test": "🧪 Pruebas",
        "chore": "🔧 Mantenimiento",
        "revert": "⏪ Revertido"
    }
    return mapping.get(c_type, "Otros")

def update_changelog(new_version, commits):
    changelog_path = "CHANGELOG.md"
    today = datetime.date.today().isoformat()
    
    params_by_type = defaultdict(list)
    
    # Categories to show to the user
    allowed_categories = [
        "🚀 Nuevas Características",
        "🐛 Correcciones",
        "🎨 Estilo Visual",
        "📚 Documentación",
        "⚡ Rendimiento",
        "⏪ Revertido"
    ]
    
    for commit in commits:
        if not commit: continue
        cat = translate_type(commit['type'])
        
        # Skip internal technical changes
        if cat not in allowed_categories and cat != "Otros":
            continue
            
        desc = commit['description']
        if commit['scope']:
            desc = f"**{commit['scope']}:** {desc}"
        params_by_type[cat].append(desc)
        
    # Build new entry
    new_entry = f"\n## {new_version} - {today}\n"
    
    # Order for display
    order = [
        "🚀 Nuevas Características", 
        "🐛 Correcciones", 
        "⚡ Rendimiento",
        "🎨 Estilo Visual",
        "📚 Documentación", 
        "⏪ Revertido"
    ]
    
    for category in order:
        if category in params_by_type:
             new_entry += f"\n### {category}\n"
             for item in params_by_type[category]:
                 new_entry += f"- {item}\n"
                 
    # Append "Otros" if any, but only if they are not in the excluded list logic (already filtered above)
    if "Otros" in params_by_type:
        new_entry += f"\n### Otros\n"
        for item in params_by_type["Otros"]:
            new_entry += f"- {item}\n"

    mode = 'w'
    content = ""
    
    if os.path.exists(changelog_path):
        with open(changelog_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if Unreleased section exists
        if "## [Unreleased]" in content:
             # Replace Unreleased with new version
            print(f"Updating Unreleased section to {new_version}")
            content = content.replace("## [Unreleased]", f"## [{new_version}] - {today}")
        else:
            # Prepend after header
            header_match = re.search(r"# Changelog.*?\n\n", content, re.DOTALL)
            if header_match:
                print(f"Prepending new version {new_version}")
                header_end = header_match.end()
                content = content[:header_end] + new_entry.strip() + "\n\n" + content[header_end:]
            else:
                 # Just prepend if no standard header
                 content = "# Changelog\n\n" + new_entry.strip() + "\n\n" + content
    else:
        content = "# Changelog\n\n" + new_entry.strip() + "\n"
        
    with open(changelog_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return new_version

def main():
    print("Analizando repositorio...")
    latest_tag = get_latest_tag()
    raw_commits = get_commits_since(latest_tag)
    parsed_commits = [parse_commit(c) for c in raw_commits if c.strip()]
    
    if not parsed_commits:
        print("No hay nuevos commits para generar un changelog.")
        return

    print(f"Encontrados {len(parsed_commits)} commits desde {latest_tag if latest_tag else 'el inicio'}.")
    
    bump = determine_version_bump(parsed_commits)
    new_version = increment_version(latest_tag, bump)
    
    print(f"Versión anterior: {latest_tag if latest_tag else '0.0.0'}")
    print(f"Tipo de incremento: {bump}")
    print(f"Nueva versión propuesta: {new_version}")
    
    update_changelog(new_version, parsed_commits)
    print(f"\nCHANGELOG.md actualizado para la versión {new_version}.")
    print("Por favor revisa el archivo CHANGELOG.md antes de hacer commit.")

if __name__ == "__main__":
    main()
