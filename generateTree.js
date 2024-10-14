const fs = require('fs');
const path = require('path');

// 제외할 디렉토리와 파일 확장자 목록
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
  'generateTree.js',
];

const ignoreExtensions = ['.class', '.jar', '.war', '.log'];
const ignoreFilesPattern = /^structure.*\.txt$/; // structure*.txt 패턴을 제외할 정규식

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
  const fileStream = fs.createWriteStream('structure.txt'); // 파일 스트림 생성
  fileStream.write(`${path.basename(targetDir)}\n`);
  printTree(targetDir, '', fileStream);
  fileStream.end(); // 파일 스트림 종료
}

// 트리 생성 실행
generateTree();
