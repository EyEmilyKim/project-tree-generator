const fs = require('fs');
const path = require('path');

/* --------  ↓ ↓ ↓ 사용자가 설정할 부분 ↓ ↓ ↓ -------- */

// 제외할 디렉토리 목록
const ignoreList = [
  'node_modules',
  '.git',
  'target',
  'build',
  '.settings',
  '.project',
  '.mvn',
  '.classpath',
  '.factorypath',
  'HELP.md',
];

// 제외할 파일 확장자 목록
const ignoreExtensions = ['.class', '.jar', '.war', '.log'];

// 하나의 depth로 묶을 디렉토리 경로 배열
const mergeDirectories = ['com', 'EyEmilyKim'];

// 제외할 파일 패턴 배열 (정규식으로 변환됨)
const ignoreFilePatterns = [
  '^generateTree.*\\.js$', // generateTree*.js 패턴 (본 스크립트)
  '^structure.*\\.txt$', // structure*.txt 패턴 (본 스크립트 결과물)
];

/* --------  ↑ ↑ ↑ 사용자가 설정할 부분 ↑ ↑ ↑ -------- */

// 파일 패턴을 정규식으로 변환하는 함수
function createIgnoreFilePatternRegExp(patterns) {
  const combinedPattern = patterns.join('|'); // 여러 패턴을 | 로 연결
  return new RegExp(combinedPattern); // 정규식으로 변환
}

// 동적으로 생성된 정규식 패턴
const ignoreFilesPattern = createIgnoreFilePatternRegExp(ignoreFilePatterns);

// 파일 이름 중복 체크 및 파일 이름 생성 함수
function getAvailableFilename(baseName, extension) {
  let counter = 0;
  let filename = `${baseName}${extension}`;

  // 파일이 이미 존재하는 경우, 숫자를 붙여 새로운 파일 이름 생성
  while (fs.existsSync(filename)) {
    counter += 1;
    filename = `${baseName}(${counter})${extension}`;
  }

  return filename;
}

// 디렉토리 트리 출력 함수 (필터 적용)
function printTree(dirPath, indent = '', fileStream) {
  const items = fs.readdirSync(dirPath).filter((item) => {
    const itemPath = path.join(dirPath, item);
    const isDir = fs.lstatSync(itemPath).isDirectory();

    // 무시할 디렉토리와 파일 필터링
    if (ignoreList.includes(item)) {
      return false;
    }

    // 파일인 경우, 파일 이름이나 확장자로 필터링
    if (!isDir) {
      if (ignoreFilesPattern.test(item)) {
        return false; // 정규식과 일치하는 파일 제외
      }
      if (ignoreExtensions.some((ext) => item.endsWith(ext))) {
        return false; // 확장자로 필터링
      }
    }

    return true;
  });

  items.forEach((item, index) => {
    const itemPath = path.join(dirPath, item);
    const isDir = fs.lstatSync(itemPath).isDirectory();
    const isLast = index === items.length - 1;

    // mergeDirectories 경로를 하나의 depth로 묶어서 처리
    if (isDir && mergeDirectories.includes(item)) {
      const mergedPath = path.join(dirPath, item);
      const subItems = fs.readdirSync(mergedPath).filter((subItem) => {
        return fs.lstatSync(path.join(mergedPath, subItem)).isDirectory();
      });

      // 하위 디렉토리가 mergeDirectories에 포함된 경로와 일치하면 묶음 처리
      if (subItems.length === 1 && mergeDirectories.includes(subItems[0])) {
        fileStream.write(`${indent}${item}.${subItems[0]}\n`);
        printTree(path.join(mergedPath, subItems[0]), indent + '    ', fileStream);
        return; // 현재 depth에서 묶음이 끝나므로 하위 디렉토리로 다시 들어가지 않음
      }
    }

    const connector = isLast ? '└── ' : '├── ';
    fileStream.write(`${indent}${connector}${item}\n`);

    if (isDir) {
      const nextIndent = isLast ? `${indent}    ` : `${indent}│   `;
      printTree(itemPath, nextIndent, fileStream);
    }
  });
}

// 실행 함수
function generateTree() {
  const targetDir = process.cwd(); // 현재 작업 디렉토리 (프로젝트 루트)

  // structure.txt 파일 이름을 만들 때 중복 처리
  const baseFilename = 'structure';
  const extension = '.txt';
  const availableFilename = getAvailableFilename(baseFilename, extension);

  // 파일 스트림 생성
  const fileStream = fs.createWriteStream(availableFilename);
  fileStream.write(`${path.basename(targetDir)}\n`);
  printTree(targetDir, '', fileStream);
  fileStream.end(); // 파일 스트림 종료
}

// 트리 생성 실행
generateTree();
