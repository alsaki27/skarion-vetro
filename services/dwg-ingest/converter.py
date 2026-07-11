"""
DWG → DXF conversion for Skarion-VETRO.
"""

import subprocess
import os
from pathlib import Path


def dwg_to_dxf(dwg_path: str, dxf_path: str, timeout: int = 120):
    """
    Convert a DWG file to DXF using ODA File Converter.
    
    Falls back to a headless AutoCAD script if ODA is not available.
    
    Args:
        dwg_path: Path to input DWG
        dxf_path: Path to output DXF
        timeout: Conversion timeout in seconds
    
    Raises:
        RuntimeError: If conversion fails
    """
    converter_path = _find_converter()
    
    if converter_path:
        _convert_with_oda(converter_path, dwg_path, dxf_path, timeout)
    else:
        _convert_with_autocad(dwg_path, dxf_path, timeout)


def _find_converter() -> str | None:
    """Locate ODA File Converter binary."""
    candidates = [
        "ODAFileConverter",
        "ODAFileConverter.exe",
        "/usr/local/bin/ODAFileConverter",
        "/opt/ODAFileConverter/ODAFileConverter",
        os.path.expanduser("~/ODAFileConverter/ODAFileConverter"),
    ]
    for c in candidates:
        try:
            result = subprocess.run([c, "--help"], capture_output=True, timeout=10)
            if result.returncode == 0:
                return c
        except (FileNotFoundError, subprocess.TimeoutExpired):
            continue
    
    # Check for accoreconsole (AutoCAD)
    try:
        result = subprocess.run(["accoreconsole.exe", "/?"], capture_output=True, timeout=10)
        if result.returncode == 0:
            return "accoreconsole.exe"
    except FileNotFoundError:
        pass
    
    return None


def _convert_with_oda(converter: str, dwg_path: str, dxf_path: str, timeout: int):
    """
    Use ODA File Converter for DWG→DXF.
    
    ODA CLI: ODAFileConverter <input_dir> <output_dir> <version> <format> <recurse>
    """
    input_dir = str(Path(dwg_path).parent)
    output_dir = str(Path(dxf_path).parent)
    
    try:
        subprocess.run(
            [converter, input_dir, output_dir, "ACAD2018", "DXF", "0"],
            check=True,
            capture_output=True,
            timeout=timeout,
        )
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"ODA conversion failed (exit {e.returncode}): {e.stderr.decode(errors='replace')[:500]}")
    except FileNotFoundError:
        raise RuntimeError(f"ODA converter not found at {converter}")


def _convert_with_autocad(dwg_path: str, dxf_path: str, timeout: int):
    """
    Fallback: use headless AutoCAD via accoreconsole.
    Requires a .scr script alongside the DWG.
    """
    scr_path = Path(dwg_path).with_suffix(".scr")
    scr_content = f"_DXFOUT\n{dxf_path}\n16\n\n"  # AC2018 DXF format
    scr_path.write_text(scr_content)
    
    try:
        subprocess.run(
            ["accoreconsole.exe", f"/i", dwg_path, f"/s", str(scr_path), "/l", "en-US"],
            check=True,
            capture_output=True,
            timeout=timeout,
        )
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"AutoCAD conversion failed: {e.stderr.decode(errors='replace')[:500]}")
    except FileNotFoundError:
        raise RuntimeError(
            "No DWG converter found. Install ODA File Converter "
            "(free, https://www.opendesign.com/guestfiles/oda_file_converter) "
            "or Autodesk Platform Services as managed fallback."
        )
