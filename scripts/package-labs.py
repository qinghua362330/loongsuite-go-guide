"""Package source only: never ship compiler caches, binaries or request logs."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
target = root / "dist/assets/labs.zip"
target.parent.mkdir(parents=True, exist_ok=True)
allowed = {".go", ".mod", ".sum", ".json", ".md", ".sh"}
with ZipFile(target, "w", compression=ZIP_DEFLATED) as archive:
    for source in sorted((root / "labs").rglob("*")):
        relative = source.relative_to(root)
        if not source.is_file() or any(part.startswith(".") for part in relative.parts):
            continue
        if source.suffix not in allowed:
            continue
        archive.write(source, relative)
print(f"{target.name}: {target.stat().st_size} bytes")
