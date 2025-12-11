# GitHub 업로드 가이드

## ✅ 완료된 작업

- Git 저장소 초기화 완료
- 모든 파일 커밋 완료 (27개 파일)
- .env 파일은 자동으로 제외됨 (보안)

## 📋 다음 단계

### 1. GitHub 저장소 생성

1. https://github.com 접속 및 로그인
2. 우측 상단의 **"+"** 버튼 클릭 → **"New repository"** 선택
3. 저장소 정보 입력:
   - **Repository name**: `registry-pdf-converter` (또는 원하는 이름)
   - **Description**: `등기부 등본 PDF를 Excel로 변환하는 AI 웹 애플리케이션`
   - **Public** 또는 **Private** 선택
   - **Initialize this repository with a README** 체크 해제 (이미 README 있음)
4. **"Create repository"** 클릭

### 2. 원격 저장소 연결 및 업로드

GitHub에서 저장소를 생성하면 표시되는 URL을 사용하여 다음 명령어를 실행하세요:

```bash
cd C:\project\registry-pdf-converter

# 원격 저장소 추가 (YOUR_USERNAME을 실제 GitHub 사용자명으로 변경)
git remote add origin https://github.com/YOUR_USERNAME/registry-pdf-converter.git

# 기본 브랜치를 main으로 변경
git branch -M main

# GitHub에 업로드
git push -u origin main
```

### 3. 인증

GitHub에 업로드할 때 인증이 필요합니다:
- **Personal Access Token** 사용 (권장)
- 또는 **GitHub Desktop** 사용

#### Personal Access Token 생성 방법:
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token" 클릭
3. 권한 선택: `repo` (전체 저장소 권한)
4. 토큰 생성 후 복사
5. `git push` 시 비밀번호 대신 토큰 입력

## 🚀 빠른 업로드 (한 번에 실행)

GitHub 저장소를 생성한 후, 아래 명령어를 실행하세요:

```powershell
cd C:\project\registry-pdf-converter

# 원격 저장소 URL을 YOUR_USERNAME과 저장소 이름으로 변경
$repoUrl = "https://github.com/YOUR_USERNAME/registry-pdf-converter.git"

git remote add origin $repoUrl
git branch -M main
git push -u origin main
```

## ✅ 확인 사항

업로드 전에 확인:
- [ ] `.env` 파일이 제외되었는지 확인 (`git status`로 확인)
- [ ] `node_modules/` 폴더가 제외되었는지 확인
- [ ] API 키가 코드에 하드코딩되지 않았는지 확인
- [ ] README.md가 포함되었는지 확인

## 📝 업로드 후 작업

1. **README 확인**: GitHub에서 README.md가 제대로 표시되는지 확인
2. **Topics 추가**: 저장소 설정에서 topics 추가 (예: `react`, `nodejs`, `pdf`, `excel`, `ai`, `gemini`)
3. **Description 업데이트**: 저장소 설명 추가
4. **License 추가**: MIT License 파일 추가 (선택사항)

## 🔗 저장소 URL 예시

업로드 후 저장소 URL:
```
https://github.com/YOUR_USERNAME/registry-pdf-converter
```

## 💡 팁

- **Private 저장소**: API 키가 포함된 코드는 Private로 설정하는 것을 권장
- **.env.example**: 공개 저장소에 `.env.example` 파일이 포함되어 있어 다른 사용자가 참고할 수 있음
- **README**: GitHub에서 자동으로 README.md가 표시됨

---

**준비 완료!** GitHub 저장소를 생성한 후 위의 명령어를 실행하세요.

