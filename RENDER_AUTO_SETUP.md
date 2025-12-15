# 🤖 Render 환경 변수 자동 설정 가이드

이 가이드는 **Render API**를 사용하여 환경 변수를 자동으로 업데이트하는 방법을 설명합니다.

---

## 🔑 1단계: Render API 키 발급

1. **Render Dashboard** 접속:
   - 🔗 https://dashboard.render.com/account/api-keys

2. **"Create API Key"** 버튼 클릭

3. **API Key 이름 설정**:
   - Name: `registry-pdf-converter-management` (또는 원하는 이름)

4. **API 키 복사**:
   - `rnd_`로 시작하는 긴 문자열
   - ⚠️ 이 키는 한 번만 표시되므로 반드시 복사해두세요!

---

## 🚀 2단계: 자동 설정 스크립트 실행

### 방법 A: 한 줄 명령어 (추천)

터미널에서 다음 명령어를 실행하세요 (API 키를 교체):

```bash
cd /home/user/webapp && \
export RENDER_API_KEY='여기에_당신의_Render_API_키를_붙여넣으세요' && \
bash update_render_env.sh
```

**예시:**
```bash
cd /home/user/webapp && \
export RENDER_API_KEY='rnd_abcd1234efgh5678ijkl9012mnop3456' && \
bash update_render_env.sh
```

### 방법 B: 단계별 실행

```bash
# 1. 프로젝트 디렉토리로 이동
cd /home/user/webapp

# 2. Render API 키 설정 (아래 키를 당신의 키로 교체)
export RENDER_API_KEY='rnd_your_actual_api_key_here'

# 3. 스크립트 실행
bash update_render_env.sh
```

---

## 📊 3단계: 결과 확인

스크립트가 성공적으로 실행되면 다음과 같은 메시지가 표시됩니다:

```
🔐 Render 환경 변수 자동 업데이트 스크립트

✅ Render API 키 확인 완료

🔍 Render 서비스 조회 중...
✅ 서비스 발견: srv-xxxxxxxxxxxxx

🔄 GEMINI_API_KEY 환경 변수 업데이트 중...
✅ GEMINI_API_KEY 업데이트 완료!

🚀 서비스 재배포 중...
✅ 재배포 시작됨!

📊 배포 상태 확인:
   https://dashboard.render.com

🎉 완료! 약 2-3분 후 새 API 키가 적용됩니다.
```

---

## ❌ 문제 해결

### 오류: "RENDER_API_KEY 환경 변수가 설정되지 않았습니다"

**원인:** API 키를 설정하지 않았거나 잘못 입력했습니다.

**해결:**
```bash
# API 키를 다시 설정
export RENDER_API_KEY='rnd_your_actual_api_key_here'

# 스크립트 재실행
bash update_render_env.sh
```

### 오류: "서비스를 찾을 수 없습니다"

**원인:** Render API 키가 유효하지 않거나, 서비스 이름이 다릅니다.

**해결:**
1. Render API 키가 올바른지 확인
2. Render Dashboard에서 서비스 이름 확인
3. 필요시 `update_render_env.sh` 스크립트에서 서비스 이름 수정

### 오류: "환경 변수 업데이트 실패"

**원인:** API 키 권한이 부족하거나, 서비스 ID가 잘못되었습니다.

**해결:**
1. Render API 키에 **Write** 권한이 있는지 확인
2. 새 API 키를 발급받아 다시 시도

---

## 🔒 보안 주의사항

- ⚠️ **Render API 키**는 매우 민감한 정보입니다
- ⚠️ GitHub에 **절대 커밋하지 마세요**
- ⚠️ 사용 후 환경 변수를 unset하세요:
  ```bash
  unset RENDER_API_KEY
  ```
- ✅ 필요시 Render Dashboard에서 API 키를 삭제할 수 있습니다

---

## 📝 수동 설정 (대안)

자동 설정이 작동하지 않는 경우, 수동으로 설정할 수 있습니다:

1. https://dashboard.render.com 접속
2. `registry-pdf-converter-api` 서비스 선택
3. **Environment** 탭 클릭
4. `GEMINI_API_KEY` 찾아서 **Edit** 클릭
5. Value를 `AIzaSyC1U1LpknIGIF2B7iMlAB6tSqSW_oFBfrs`로 변경
6. **Save Changes** 클릭
7. **Manual Deploy** 실행

---

## ✅ 완료 확인

배포 완료 후 (약 2-3분) 다음 명령어로 확인:

```bash
curl https://registry-pdf-converter-api.onrender.com/api/health
```

**예상 응답:**
```json
{"status":"ok","message":"서버가 정상 작동 중입니다."}
```

---

**작성일**: 2025-12-15
**스크립트**: `update_render_env.sh`
