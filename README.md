# {{PROJECT\_DISPLAY\_NAME}} 🚀

ברוכים הבאים ל־**{{PROJECT\_DISPLAY\_NAME}}** — תבנית ייצורית, מודרנית ומאובטחת המנוהלת ע"י פלטפורמת **WIZBI**.
המאגר מהווה תשתית מוצקה לאפליקציות ענן־נייטיב: אתרים, שירותי Backend, כלים פנימיים ועוד. הוא כולל Backend מאובטח מוכן־לשימוש וחיבור ישיר ל־**Vertex AI (Gemini)** כדי שתוכלו לבנות פיצ'רי AI מתקדמים מהיום הראשון — בלי תשתיות מסובכות.

> **פילוסופיית הפרויקט:** 100% Cloud-Native ו־AI-Driven — כל הפיתוח וה־Deployment מנוהלים דרך Git בלבד.

---

## תוכן עניינים

* [סקירה כללית](#סקירה-כללית)
* [ארכיטקטורה ותכונות ליבה](#ארכיטקטורה-ותכונות-ליבה)
* [זרימת פיתוח ו־Deployment (CI/CD)](#זרימת-פיתוח-וידeployment-cicd)
* [שימוש ביכולות ה-AI — נקודת הקצה `/api/chat`](#שימוש-ביכולות-הai--נקודת-הקצה-apichat)
* [קבצים ותיקיות מרכזיים](#קבצים-ותיקיות-מרכזיים)
* [נתוני פרויקט (Project Vitals)](#נתוני-פרויקט-project-vitals)
* [הערות חשובות](#הערות-חשובות)

---

## סקירה כללית

המאגר הזה הוא בסיס אפליקטיבי ייצור־מוכן שמאפשר להתחיל מהר, בבטחה ובסקייל. הוא מגיע עם Backend מאובטח מראש ואינטגרציה מובנית ל־Vertex AI לשימוש ביכולות Generative AI מכל Frontend או שירות אחר באמצעות API פשוט.

---

## ארכיטקטורה ותכונות ליבה

**Serverless & Scalable**

* Backend קליל ב־**Node.js/Express** שרץ על **Google Cloud Run** פרטי, ומתרחב אוטומטית לפי העומס.

**Secure by Design**

* **Firebase Hosting** משמש כשער מאובטח ו־Global CDN.
* שירות ה־Backend **לא חשוף לאינטרנט**; Firebase מזמן אותו באופן פרטי באמצעות **IAM**.

**AI-Ready Backend**

* נקודת קצה מלאה: **`/api/chat`** המחוברת ל־**Vertex AI (Gemini)** — אינטגרציית AI מהירה לכל לקוח/Frontend.

**Automated CI/CD**

* **GitHub Actions** מוגדר מראש לבדיקות, בנייה ו־Deployment אוטומטי ל־**QA** ול־**Production**.

**תרשים זרימה (גבוה):**

```
User
  ↓
Firebase Hosting (CDN)
  ↓  [Rewrite Rule]
[SECURE IAM INVOCATION]
  ↓
Private Cloud Run Service
  ↓
Vertex AI (Gemini)
```

---

## זרימת פיתוח ו־Deployment (CI/CD)

> ⚠️ **אין לפרוס ידנית.** ה־git push הוא הטריגר היחיד לפריסה.

1. **Task Definition** – מגדירים פיצ'ר/באג (למשל: "להוסיף endpoint חדש ב־`/api/inventory`").
2. **Code Generation** – מפעיל/ה עוזר/ת AI לקריאת קבצי המאגר והפקת קוד מלא לקבצים המושפעים.
3. **Commit** – מאמתים ומבצעים commit לענף.
4. **Deployment Trigger** – `git push` מפעיל את ה־Pipeline.
5. **Push ל־`dev`** – פריסה אוטומטית ל־**QA**.
6. **Merge ל־`main`** – פריסה אוטומטית ל־**Production**.
7. **Verification** – עוקבים בטאב **Actions** ב־GitHub ובודקים את האפליקציה החיה ב־URL הייעודי.

---

## שימוש ביכולות ה-AI — נקודת הקצה `/api/chat`

נקודת קצה מבוססת **Streaming** מול Gemini. מתאימה לבניית צ'אטבוטים, כלי יצירת טקסט, ניתוח נתונים ועוד.

### בקשה (POST `/api/chat`)

```json
{
  "message": "What are the top 5 benefits of using a serverless architecture?",
  "history": [
    { "role": "user",  "parts": [{ "text": "Hi, can you explain cloud computing?" }] },
    { "role": "model", "parts": [{ "text": "Of course! Cloud computing is..." }] }
  ]
}
```

### דוגמת `curl`

```bash
curl -X POST https://<your-domain>/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are the top 5 benefits of using a serverless architecture?",
    "history": [
      { "role": "user",  "parts": [{ "text": "Hi, can you explain cloud computing?" }] },
      { "role": "model", "parts": [{ "text": "Of course! Cloud computing is..." }] }
    ]
  }'
```

> **הערה על Streaming:** התגובה מוזרמת מהמודל בזמן אמת — מומלץ בצד ה־Frontend לקרוא את ה־stream ולהציג טקסט מתווסף (tokens) באופן אינקרמנטלי.

---

## קבצים ותיקיות מרכזיים

* `src/index.ts` – נקודת הכניסה ללוגיקת ה־Backend. להוסיף כאן ראוטים/לוגיקה.
* `src/services/vertex.ts` – הליבה לתקשורת עם Vertex AI.
* `src/routes/ai.ts` – מגדיר את ראוט **`/api/chat`** (ניתן להוסיף ראוטים נוספים הקשורים ל־AI).
* `public/` – קבצי Frontend סטטיים (HTML/CSS/JS). `index.html` הוא placeholder ברירת מחדל.
* `package.json` – תלותים וסקריפטים (Express, Vertex AI וכו').
* `.github/workflows/deploy.yml` – Pipeline אוטומטי (Managed by WIZBI) — **לא לשינוי**.
* `Dockerfile` – מגדיר את קונטיינר ה־Backend.
* `firebase.json` – הגדרות Firebase Hosting ו־Rewrite לשירות ה־Backend.

---

## נתוני פרויקט (Project Vitals)

| פרמטר                | ערך                        |
| -------------------- | -------------------------- |
| **Project Name**     | `{{PROJECT_DISPLAY_NAME}}` |
| **WIZBI Project ID** | `{{PROJECT_ID}}`           |
| **GCP Region**       | `{{GCP_REGION}}`           |

---

## הערות חשובות

* 🚫 **אל תשנו** את הקובץ: `.github/workflows/deploy.yml` — מנוהל במלואו ע"י **WIZBI**.
* 🚀 **Deployment מתבצע רק דרך Git**:

  * Push ל־`dev` ⇒ פריסה ל־QA
  * Merge ל־`main` ⇒ פריסה ל־Production
* 🔐 השירות ב־Cloud Run **פרטי** ונקרא רק דרך Firebase + IAM. אין לפתוח אותו לציבור.
* 🤖 הרחבות AI: הוסיפו ראוטים נוספים תחת `src/routes/` תוך שימוש בשירותים ב־`src/services/`.

---

### (אופציונלי) הרצה מקומית

אם תרצו להריץ לוקלית (לצורכי פיתוח בלבד), תוכלו בדרך כלל:

```bash
# התקנת תלויות
npm install

# הרצה (תלוי בסקריפטים שב-package.json)
npm run dev    # או: npm start
```

> קונפיגורציות ענן/פריסה מנוהלות ע"י WIZBI; הרצה מקומית מיועדת לבדיקה/פיתוח בלבד.

---

בהצלחה! 💫
**{{PROJECT\_DISPLAY\_NAME}}** — נקודת פתיחה יציבה, מאובטחת, ו־AI-Ready לאפליקציות ענן מודרניות.
