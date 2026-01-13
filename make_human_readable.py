import re
import json
import os

def parse_raw_md(raw_file='prompts/cline_chat_history_RAW_last_500_rows.md'):
    with open(raw_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find JSON blocks
    json_blocks = re.findall(r'```json\\n(.*?)\\n```', content, re.DOTALL)
    messages = []

    for block in json_blocks:
        try:
            data = json.loads(block)
            # Assume structure like chat messages array or key with messages
            if isinstance(data, list):
                for msg in data:
                    if 'prompt' in msg or 'user' in msg or 'role' in msg:
                        messages.append(msg)
            elif 'messages' in data:
                messages.extend(data['messages'])
            elif 'inputText' in data:
                messages.append({'role': 'user', 'content': data['inputText']})
            # Add more patterns as needed
        except:
            pass

    # Raw values too
    raw_blocks = re.findall(r'```\\n(.*?)\\n```', content, re.DOTALL)
    for block in raw_blocks:
        if 'prompt' in block.lower() or 'user' in block.lower() or 'response' in block.lower():
            messages.append({'role': 'raw', 'content': block.strip()[:1000]})

    return messages

def generate_human_readable(messages, output_file='prompts/cline_chat_history_human_readable_last_500_rows.md'):
    md = "# Cline Chat - Human Readable Extract\\n\\n"

    for i, msg in enumerate(messages, 1):
        role = msg.get('role', 'unknown')
        content = msg.get('content', msg)
        md += f"## Message {i} ({role})\\n\\n"
        md += f"`{content}`\\n\\n"

    if not messages:
        md += "## No Prompts/Responses Found\\n"
        md += "Raw DB data contains session states but no full chat text (likely in-memory or encrypted). See raw MD for details.\\n"

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(md)

    print(f"✅ Generated human-readable MD: {output_file}")

if __name__ == "__main__":
    generate_human_readable(parse_raw_md())
