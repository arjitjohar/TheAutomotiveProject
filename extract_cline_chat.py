import os
import sqlite3
import glob
from datetime import datetime
import json

def main():
    base_path = r"/mnt/c/Users/arjitjohar/AppData/Roaming/Code/User/workspaceStorage"
    db_files = glob.glob(os.path.join(base_path, "*/state.vscdb"))
    global_db = r"/mnt/c/Users/arjitjohar/AppData/Roaming/Code/User/globalStorage/state.vscdb"
    if os.path.exists(global_db):
        db_files.append(global_db)

    md_content = "# Cline Chat History Export\\n\\n"
    md_content += f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\\n\\n"
    md_content += "## Raw Full Extract Summary\\n"
    md_content += "- Full raw dump from all state.vscdb ItemTable (top 500 recent rows per DB).\\n"
    md_content += "- Includes all keys/values (JSON parsed where possible).\\n"
    md_content += "- Generated for complete chat/project state export.\\n\\n"

    chats_found = False
    for db_path in db_files:
        folder = os.path.basename(os.path.dirname(db_path))
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute("""
                SELECT key, value FROM ItemTable 
                ORDER BY rowid DESC LIMIT 500
            """)
            rows = cursor.fetchall()
            if rows:
                chats_found = True
                md_content += f"## Data from {folder} ({db_path})\\n\\n"
                for key, value in rows:
                    md_content += f"### Key: `{key}`\\n\\n"
                    try:
                        # Try to parse JSON value
                        parsed = json.loads(value)
                        md_content += f"**Parsed JSON**:\\n```json\\n{json.dumps(parsed, indent=2)}\\n```\\n\\n"
                    except:
                        md_content += f"**Raw Value**:\\n```\\n{value[:4000]}\\n```\\n\\n"  # Truncate long values
            conn.close()
        except Exception as e:
            md_content += f"### Error reading {folder}: {str(e)}\\n\\n"

    if not chats_found:
        md_content += "## No Specific Cline Data Found\\n"
        md_content += "Chat history may be in extension memory or different keys. Full conversation summary above.\\n"

    with open("cline_chat_history.md", "w", encoding="utf-8") as f:
        f.write(md_content)

    print("✅ Saved chat history to cline_chat_history.md")
    print("Run `git add cline_chat_history.md && git commit -m 'Add Cline chat history export' && git push` to upload.")

if __name__ == "__main__":
    main()
