# 포스팅 가이드

이 프로젝트를 포스팅하는 방법을 안내합니다.

## 📝 포스팅 옵션

### 1. GitHub에 업로드하기

#### Step 1: GitHub 저장소 생성
1. GitHub에 로그인
2. "New repository" 클릭
3. 저장소 이름: `registry-pdf-converter`
4. Public 또는 Private 선택
5. "Create repository" 클릭

#### Step 2: Git 초기화 및 업로드
```bash
cd C:\project\registry-pdf-converter

# Git 초기화
git init

# .gitignore 파일 생성 (필요한 경우)
echo "node_modules/" > .gitignore
echo ".env" >> .gitignore
echo "uploads/" >> .gitignore
echo "outputs/" >> .gitignore

# 파일 추가
git add .

# 커밋
git commit -m "Initial commit: 등기부 등본 PDF → Excel 변환기"

# 원격 저장소 추가 (GitHub에서 제공하는 URL 사용)
git remote add origin https://github.com/YOUR_USERNAME/registry-pdf-converter.git

# 업로드
git branch -M main
git push -u origin main
```

#### Step 3: README 업데이트
- GitHub 저장소의 README.md가 자동으로 표시됩니다
- 스크린샷을 추가하면 더 좋습니다

### 2. 기술 블로그에 포스팅하기

#### 추천 플랫폼
- **Velog** (한국): https://velog.io
- **Medium**: https://medium.com
- **Tistory**: https://www.tistory.com
- **개인 블로그**: WordPress, Ghost 등

#### 포스팅 구조 제안
1. **제목**: "등기부 등본 PDF를 Excel로 변환하는 AI 웹앱 만들기"
2. **소개**: 프로젝트 목적과 해결하려는 문제
3. **기술 스택**: 사용한 기술과 선택 이유
4. **구현 과정**: 핵심 기능 구현 방법
5. **결과 및 성과**: 완성된 기능과 개선점
6. **코드 하이라이트**: 주요 코드 설명
7. **결론**: 배운 점과 향후 계획

#### BLOG_POST.md 활용
- `BLOG_POST.md` 파일을 참고하여 포스팅 작성
- 코드 스니펫은 실제 코드로 교체
- 스크린샷 추가 권장

### 3. 개발 커뮤니티에 공유하기

#### 추천 커뮤니티
- **개발자스럽다**: https://blog.gaerae.com
- **OKKY**: https://okky.kr
- **Reddit**: r/webdev, r/javascript
- **Dev.to**: https://dev.to

#### 공유 포인트
- AI를 활용한 문서 처리
- 실용적인 웹 애플리케이션
- 오픈소스 프로젝트

## 📸 스크린샷 촬영 가이드

### 추천 스크린샷
1. **메인 화면**: 드래그 앤 드롭 영역
2. **변환 결과**: Excel 미리보기 화면
3. **Excel 파일**: 생성된 Excel 파일 화면

### 스크린샷 도구
- Windows: Win + Shift + S
- Mac: Cmd + Shift + 4
- 온라인: https://www.screencastify.com

## 🎬 데모 영상 만들기

### 추천 도구
- **OBS Studio**: 무료 화면 녹화
- **Loom**: 간단한 화면 녹화 및 공유
- **ScreenFlow** (Mac): 전문적인 화면 녹화

### 데모 시나리오
1. PDF 파일 업로드 (5초)
2. 변환 진행 과정 (10초)
3. 결과 미리보기 (10초)
4. Excel 다운로드 (5초)

## 📋 체크리스트

### GitHub 업로드 전
- [ ] `.gitignore` 파일 확인
- [ ] API 키가 코드에 하드코딩되지 않았는지 확인
- [ ] README.md 업데이트
- [ ] 라이선스 파일 추가 (선택사항)

### 블로그 포스팅 전
- [ ] 스크린샷 추가
- [ ] 코드 스니펫 문법 하이라이팅 확인
- [ ] 링크 및 참고 자료 확인
- [ ] 오타 및 문법 검사

## 🔗 링크 추가 예시

### 프로젝트 링크
```markdown
- GitHub: https://github.com/YOUR_USERNAME/registry-pdf-converter
- 데모: https://your-demo-url.com (배포한 경우)
```

### 참고 자료
```markdown
- [Google Gemini API 문서](https://ai.google.dev/docs)
- [ExcelJS GitHub](https://github.com/exceljs/exceljs)
- [React 공식 문서](https://react.dev)
```

## 💡 포스팅 팁

1. **제목**: 명확하고 검색 가능한 제목 사용
2. **태그**: 관련 기술 태그 추가 (React, Node.js, AI, PDF 등)
3. **코드**: 실제 작동하는 코드만 공유
4. **설명**: 코드의 "왜"를 설명하는 것이 중요
5. **시각화**: 스크린샷과 다이어그램 활용

## 🚀 배포 옵션 (선택사항)

### 무료 호스팅
- **Vercel**: 프론트엔드 배포
- **Railway**: 백엔드 배포
- **Render**: 풀스택 배포

### 배포 후 포스팅에 추가
```markdown
## 🌐 라이브 데모
- [웹 애플리케이션](https://your-app-url.com)
- [GitHub 저장소](https://github.com/YOUR_USERNAME/registry-pdf-converter)
```

## 📧 문의

포스팅 관련 질문이 있으시면 GitHub 이슈를 등록해주세요.

---

**Happy Coding! 🎉**

