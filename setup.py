import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))


def is_separator(line):
    s = line.strip()
    return len(s) >= 20 and set(s) == {"-"}


def finalize(buf):
    # drop trailing separator/blank lines, then leading separator lines
    while buf and (buf[-1].strip() == "" or is_separator(buf[-1])):
        buf.pop()
    while buf and is_separator(buf[0]):
        buf.pop(0)
    text = "\n".join(buf).rstrip() + "\n"
    if text.strip() == "(empty file)":
        return ""
    return text


def write(folder, rel, content):
    # paths inside the txt start with "frontend/" or "backend/" — strip it
    prefix = folder + "/"
    if rel.startswith(prefix):
        rel = rel[len(prefix):]
    full = os.path.join(HERE, folder, rel)
    os.makedirs(os.path.dirname(full) or HERE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
    print("  created  " + os.path.join(folder, rel).replace("\\", "/"))
    return 1


def extract(txt_name, folder):
    path = os.path.join(HERE, txt_name)
    if not os.path.exists(path):
        print("ERROR: " + txt_name + " not found next to setup.py")
        sys.exit(1)
    with open(path, encoding="utf-8-sig") as f:
        lines = f.read().splitlines()
    current, buf, count = None, [], 0
    for line in lines:
        if line.startswith("FILE: "):
            if current is not None:
                count += write(folder, current, finalize(buf))
            current, buf = line[6:].strip(), []
        elif line.strip() == "END OF FILES":
            if current is not None:
                count += write(folder, current, finalize(buf))
            current, buf = None, []
        elif current is not None:
            buf.append(line)
    if current is not None:
        count += write(folder, current, finalize(buf))
    return count


if __name__ == "__main__":
    print("Extracting frontend...")
    n1 = extract("frontend.txt", "frontend")
    print("Extracting backend...")
    n2 = extract("backend.txt", "backend")
    print("")
    print("Done: " + str(n1) + " files -> app/frontend, "
          + str(n2) + " files -> app/backend")
    print("Next: 1) fill app/frontend/.env and app/backend/.env")
    print("      2) run app/backend/schema.sql in Supabase SQL Editor")
    print("      3) start backend:  cd backend && python -m venv venv")
    print("         (Windows: venv\\Scripts\\activate | macOS/Linux: source venv/bin/activate)")
    print("         pip install -r requirements.txt")
    print("         uvicorn app.main:app --reload --port 8000")
    print("      4) start frontend: cd ../frontend && npm install && npm run dev")
