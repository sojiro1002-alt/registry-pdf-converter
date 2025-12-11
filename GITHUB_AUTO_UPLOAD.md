# GitHub 자동 업로드 가이드

## 방법 1: GitHub CLI 인증 후 자동 업로드 (권장)

### Step 1: GitHub CLI 인증
터미널에서 다음 명령어 실행:
```powershell
gh auth login
```
- 브라우저에서 인증 진행
- 또는 토큰으로 인증

### Step 2: 자동 업로드
인증 완료 후:
```powershell
cd C:\project\registry-pdf-converter
gh repo create registry-pdf-converter --public --source=. --remote=origin --push
```

## 방법 2: 웹에서 저장소 생성 후 업로드

### Step 1: GitHub에서 저장소 생성
1. https://github.com/new 접속
2. Repository name: `registry-pdf-converter`
3. Description: `등기부 등본 PDF를 Excel로 변환하는 AI 웹 애플리케이션`
4. Public 선택
5. **"Initialize this repository with a README" 체크 해제** (이미 README 있음)
6. "Create repository" 클릭

### Step 2: 푸시
저장소 생성 후 다음 명령어 실행:
```powershell
cd C:\project\registry-pdf-converter

# 원격 저장소 설정
git remote remove origin 2>$null
git remote add origin https://github.com/sojiro1002-alt/registry-pdf-converter.git
git branch -M main

# 푸시 (인증 필요)
git push -u origin main
```

**인증 방법:**
- Personal Access Token 사용 (권장)
- GitHub Desktop 사용
- SSH 키 사용

## Personal Access Token 생성

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token (classic)" 클릭
3. Note: `registry-pdf-converter`
4. Expiration: 원하는 기간 선택
5. Scopes: `repo` 체크
6. "Generate token" 클릭
7. 토큰 복사 (한 번만 표시됨!)

**푸시 시:**
- Username: `sojiro1002-alt`
- Password: 생성한 토큰 입력

## 완료 확인

업로드 성공 후:
- https://github.com/sojiro1002-alt/registry-pdf-converter 접속
- 파일들이 표시되는지 확인
- README.md가 제대로 표시되는지 확인

---

**현재 상태:**
- ✅ Git 저장소 초기화 완료
- ✅ 모든 파일 커밋 완료
- ✅ 원격 저장소 설정 완료
- ⏳ GitHub 저장소 생성 필요
- ⏳ 푸시 필요 (인증 필요)

