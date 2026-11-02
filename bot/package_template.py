import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / 'packages' / 'mercenta-shop-template'
FILES = ['README.md', 'shop.config.json', '.env.example', 'package.json', 'tsconfig.json', 'mercenta-shop.service', 'src/bot.ts', 'src/setup-wizard.ts', 'bot.py', 'messages.json', 'test_bot.py']


def build():
    shutil.copyfile(ROOT / 'bot' / 'polling.py', TEMPLATE / 'bot.py')
    shutil.copyfile(ROOT / 'bot' / 'messages.json', TEMPLATE / 'messages.json')
    shutil.copyfile(ROOT / 'bot' / 'test_polling.py', TEMPLATE / 'test_bot.py')
    test = (TEMPLATE / 'test_bot.py').read_text(encoding='utf-8').replace('import polling\n', 'import bot as polling\n')
    (TEMPLATE / 'test_bot.py').write_text(test, encoding='utf-8')
    destination = ROOT / 'web' / 'public' / 'downloads' / 'mercenta-shop-template.zip'
    destination.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(destination, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
        for relative in FILES:
            source = TEMPLATE / relative
            if not source.is_file():
                raise RuntimeError('Missing public template file: ' + relative)
            info = zipfile.ZipInfo('mercenta-shop-template/' + relative, date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, source.read_bytes())
    print('Built allowlisted template archive: ' + str(destination.relative_to(ROOT)))


if __name__ == '__main__':
    build()
