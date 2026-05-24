---
marp: true
theme: viably
paginate: true
size: 16:9
style: |
  section { font-size: 27px; }
---

<!-- _class: lead -->

<div class="kicker">Viably</div>

# <span class="gradient">From vibe to viable</span>

## AI-платформа, которая превращает текстовый запрос в рабочий продукт

<div class="grid-3" style="margin-top:28px;">
  <div class="metric"><strong>Telegram bots</strong><span>Боты и backend-сервисы из естественного языка</span></div>
  <div class="metric"><strong>One-click deploy</strong><span>Сборка и выкладка без ручной DevOps-рутины</span></div>
  <div class="metric"><strong>Russian-first UX</strong><span>Порог входа ниже для локального рынка</span></div>
</div>

<div class="footer-note">Красивый product / pitch deck, версия 1</div>

---

<div class="kicker">Проблема</div>

# Идея появляется <span class="gradient">быстрее, чем команда успевает её собрать</span>

<div class="grid-3" style="margin-top:18px;">
  <div class="card"><strong>Низкая скорость</strong><p>Даже простой MVP требует аналитики, архитектуры, backend, UI и deploy. Для большинства это недели или месяцы.</p></div>
  <div class="card"><strong>Высокий порог</strong><p>Не-технические пользователи не могут дойти от идеи до рабочего продукта без дорогой команды.</p></div>
  <div class="card"><strong>Срыв импульса</strong><p>На этапе «сделаю потом» умирает большая часть идей, потому что путь слишком тяжёлый.</p></div>
</div>

---

<div class="kicker">Решение</div>

# <span class="gradient">Viably</span> делает путь коротким: от промпта к рабочему приложению

<div class="two-col" style="margin-top:14px;">
  <div class="card">
    <h3>Что получает пользователь</h3>
    <ul>
      <li><strong>AI generation</strong> кода на основе обычного текста</li>
      <li><strong>Готовые шаблоны</strong> для Telegram-ботов, API и сервисов</li>
      <li><strong>Развёртывание в 1 клик</strong> на собственной инфраструктуре</li>
      <li><strong>Прозрачная кредитная модель</strong> вместо сложного биллинга по токенам</li>
    </ul>
  </div>
  <div class="card">
    <h3>Ключевая идея продукта</h3>
    <p class="quote">Пользователь формулирует, <span class="highlight">что</span> хочет получить. Viably берёт на себя <span class="highlight">как это собрать и выкатить</span>.</p>
  </div>
</div>

---

<div class="kicker">Как это работает</div>

# 4 шага до результата

<div class="grid-4" style="margin-top:24px;">
  <div class="card"><strong>01. Prompt</strong><p>Пользователь описывает идею на обычном языке.</p></div>
  <div class="card"><strong>02. Generation</strong><p>Viably генерирует структуру, код и артефакты проекта.</p></div>
  <div class="card"><strong>03. Iteration</strong><p>Пользователь уточняет, редактирует и дожимает результат в диалоге.</p></div>
  <div class="card"><strong>04. Deploy</strong><p>Готовый проект выкатывается в production без ручной сборки.</p></div>
</div>

<hr />

<p><strong>Итог:</strong> вместо цепочки «идея → поиск подрядчика → ТЗ → разработка → деплой» пользователь получает единый AI-native flow внутри одной платформы.</p>

---

<div class="kicker">Что можно собирать</div>

# Не один narrow use case, а <span class="gradient">категория рабочих продуктов</span>

<div class="grid-3" style="margin-top:18px;">
  <div class="card"><strong>Telegram bots</strong><p>Поддержка, лидогенерация, автоматизации, внутренние инструменты.</p></div>
  <div class="card"><strong>Backend apps</strong><p>API, сервисы, админки, логика обработки данных и интеграции.</p></div>
  <div class="card"><strong>Web / landing flows</strong><p>Лендинги и веб-интерфейсы поверх готового boilerplate и AI-кастомизации.</p></div>
</div>

<div class="grid-3" style="margin-top:18px;">
  <div class="metric"><strong>Шаблоны</strong><span>Ускоряют старт и снижают хаос в генерации</span></div>
  <div class="metric"><strong>Диалоговый UX</strong><span>Проще дорабатывать результат итерациями</span></div>
  <div class="metric"><strong>Свой deploy loop</strong><span>Важный moat против «просто чат-ботов с кодом»</span></div>
</div>

---

<div class="kicker">Почему это сильнее обычного AI-чата</div>

# Viably продаёт не ответ модели, а <span class="gradient">рабочий execution layer</span>

<div class="grid-2" style="margin-top:18px;">
  <div class="card">
    <h3>Обычный AI-чат</h3>
    <ul>
      <li>Даёт фрагменты кода</li>
      <li>Не отвечает за структуру проекта</li>
      <li>Не доводит до deploy</li>
      <li>Оставляет пользователя один на один с инфраструктурой</li>
    </ul>
  </div>
  <div class="card">
    <h3>Viably</h3>
    <ul>
      <li><span class="success">Генерирует проект целиком</span></li>
      <li><span class="success">Использует шаблоны и управляемый flow</span></li>
      <li><span class="success">Покрывает deploy и lifecycle</span></li>
      <li><span class="success">Даёт продуктовый UX, а не просто текст</span></li>
    </ul>
  </div>
</div>

---

<div class="kicker">Монетизация</div>

# Понятная кредитная модель + подписка

<div class="two-col" style="margin-top:10px;">
  <div>
    <table>
      <thead>
        <tr><th>План</th><th>Цена</th><th>Кредиты / мес</th><th>Deploy limit</th></tr>
      </thead>
      <tbody>
        <tr><td>Free</td><td>$0</td><td>5</td><td>0</td></tr>
        <tr><td>Starter</td><td>$15</td><td>100</td><td>2</td></tr>
        <tr><td>Pro</td><td>$39</td><td>300</td><td>5</td></tr>
        <tr><td>Business</td><td>$149</td><td>1000</td><td>15</td></tr>
      </tbody>
    </table>
  </div>
  <div class="card">
    <h3>Почему модель хорошая</h3>
    <ul>
      <li><strong>Post-pay логика:</strong> ценность ближе к фактическому использованию</li>
      <li><strong>Прозрачность:</strong> списание видно пользователю после генерации</li>
      <li><strong>Расширяемость:</strong> top-up пакеты и rollover дают хороший апсейл</li>
      <li><strong>Unit economics:</strong> credit abstraction скрывает сложность token billing</li>
    </ul>
  </div>
</div>

---

<div class="kicker">Позиционирование</div>

# Где Viably может занять сильную позицию

<div class="grid-3" style="margin-top:18px;">
  <div class="card"><strong>RU / CIS first</strong><p>Русскоязычный UX и локально понятный сценарий для рынка, где многим нужен не copilot, а готовый путь к результату.</p></div>
  <div class="card"><strong>SMB и solo builders</strong><p>Фрилансеры, агентства, founders и small teams, которым нужна скорость без найма полноценной команды.</p></div>
  <div class="card"><strong>AI-native builder stack</strong><p>Побеждает не тот, кто умеет «генерировать код», а тот, кто лучше превращает генерацию в стабильный продуктовый workflow.</p></div>
</div>

---

<div class="kicker">Почему сейчас</div>

# Окно возможностей <span class="gradient">открыто прямо сейчас</span>

<div class="grid-3" style="margin-top:18px;">
  <div class="metric"><strong>Модели созрели</strong><span>Качество generation уже достаточно высокое для реальных рабочих сценариев.</span></div>
  <div class="metric"><strong>Спрос огромный</strong><span>Пользователи хотят «сделайте мне продукт», а не «научите меня программировать».</span></div>
  <div class="metric"><strong>Execution moat</strong><span>Инфраструктура, deploy, шаблоны и UX сложнее копируются, чем просто промпт.</span></div>
</div>

---

<div class="kicker">Видение</div>

# Viably = слой, где <span class="gradient">AI собирает цифровые продукты под задачу пользователя</span>

<div class="card" style="margin-top:18px;">
  <p class="quote">Не очередной AI-чат, а платформа, где идея становится рабочим ботом, сервисом или сайтом быстрее, чем человек успевает потерять импульс.</p>
</div>

<div class="grid-3" style="margin-top:20px;">
  <div class="card"><strong>Short term</strong><p>Дожать лучший UX генерации и deploy.</p></div>
  <div class="card"><strong>Mid term</strong><p>Усилить template ecosystem и repeatable workflows.</p></div>
  <div class="card"><strong>Long term</strong><p>Стать AI operating layer для малого digital product creation.</p></div>
</div>

---

<!-- _class: lead -->

<div class="kicker">Финал</div>

# <span class="gradient">Viably</span>

## От идеи в голове до рабочего digital-продукта, без тяжёлого классического цикла разработки

<div class="card" style="margin-top:26px; text-align:left;">
  <strong>Можно дальше быстро сделать 3 версии этой же презентации:</strong>
  <p>1. investor deck, 2. sales deck для клиентов, 3. product vision deck для команды.</p>
</div>
