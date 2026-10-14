import sys
import os

# Ensure local ffmpeg in bin/ is added to PATH if present
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in os.environ.get("PATH", ""):
    os.environ["PATH"] = script_dir + os.pathsep + os.environ.get("PATH", "")

# Try static_ffmpeg as fallback if ffmpeg is still not in PATH
try:
    import shutil
    if not shutil.which("ffmpeg"):
        import static_ffmpeg
        static_ffmpeg.add_paths()
except Exception:
    pass

try:
    from audio_separator.utils.cli import main
    if __name__ == "__main__":
        main()
except Exception as e:
    sys.stderr.write(f"Audio separator error: {e}\n")
    sys.exit(1)
