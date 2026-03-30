const { withProjectBuildGradle } = require('expo/config-plugins');

module.exports = function withAndroidKotlinFix(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      let contents = config.modResults.contents;
      
      // 1-1. 잘못된 하드코딩 라인(1.5.10 등)이 있으면 제거
      // 예: classpath 'org.jetbrains.kotlin:kotlin-gradle-plugin:1.5.10'
      const hardcodedRegex = /classpath\s*['"]org\.jetbrains\.kotlin:kotlin-gradle-plugin:[\d.]+['"]/g;
      if (hardcodedRegex.test(contents)) {
        contents = contents.replace(hardcodedRegex, ''); // 라인 삭제 (빈 문자열)
      }

      // 1-2. 기존에 kotlinVersion 변수 정의가 있다면 2.0.21로 교체
      const variableRegex = /kotlinVersion\s*=\s*['"][\d.]+['"]/m;
      if (variableRegex.test(contents)) {
        contents = contents.replace(variableRegex, `kotlinVersion = "2.0.21"`);
      } else {
        // 2. 없다면 ext 블록 안에 주입
        if (contents.includes('ext {')) {
          contents = contents.replace('ext {', `ext {\n        kotlinVersion = "2.0.21"`);
        } else if (contents.includes('buildscript {')) {
          contents = contents.replace('buildscript {', `buildscript {\n    ext {\n        kotlinVersion = "2.0.21"\n    }`);
        }
      }
      
      config.modResults.contents = contents;
    }
    return config;
  });
};
