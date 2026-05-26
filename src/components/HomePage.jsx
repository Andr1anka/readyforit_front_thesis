import "../styles/home.css";

import Layout from "./layout/Layout";

import catLeft from "../assets/images/cat-left.png";
import catRight from "../assets/images/cat-right.png";
import appPreview from "../assets/images/app-preview.png";

export default function HomePage({ onLogout, onNavigate, current }) {
  return (
    <Layout onLogout={onLogout} onNavigate={onNavigate} current={current}>
      <main className="main-page">
        <section className="hero-section">
          <img className="cat-left" src={catLeft} alt="ReadyForIT Cat" />

          <div className="hero-text">
            <p className="hero-label">Готові до технічного інтервʼю?</p>

            <h1>
              Ласкаво просимо до <span>ReadyForIT</span>
            </h1>

            <p className="hero-description">
              Підготуйтеся до своєї наступної співбесіди разом із платформою
              для проведення пробних технічних інтервʼю. Обирайте перевірених
              експертів, практикуйте live coding та отримуйте зрозумілий фідбек
              після кожної зустрічі.
            </p>

            <div className="hero-actions">
              <button
                type="button"
                className="primary-btn"
                onClick={() => onNavigate?.("interviewers")}
              >
                Переглянути інтервʼюерів
              </button>

              <a className="secondary-btn" href="#advantages">
                Дізнатися більше
              </a>
            </div>
          </div>

          <div className="hero-preview">
            <img
              className="app-preview-img"
              src={appPreview}
              alt="ReadyForIT Preview"
            />
          </div>
        </section>

        <section className="advantages-section" id="advantages">
          <h2>Як ми можемо вам допомогти?</h2>

          <div className="advantages-grid">
            <article className="advantage-card">
              <h3>Персонал</h3>
              <p>
                Особистий профіль, історія активності та можливості відповідно
                до ролі користувача: кандидата, інтервʼюера або адміністратора.
              </p>
            </article>

            <article className="advantage-card">
              <h3>Практичний перший досвід</h3>
              <p>
                Реалістичний формат пробної технічної співбесіди допомагає
                зменшити хвилювання перед справжнім інтервʼю.
              </p>
            </article>

            <article className="advantage-card">
              <h3>Графік</h3>
              <p>
                Зручно плануйте інтервʼю, обирайте доступний час і готуйтеся
                без хаосу та зайвих повідомлень.
              </p>
            </article>

            <article className="advantage-card">
              <h3>Перевірені експерти</h3>
              <p>
                Інтервʼю проводять спеціалісти з досвідом у сфері IT, які
                можуть обʼєктивно оцінити ваші знання.
              </p>
            </article>

            <article className="advantage-card">
              <h3>Відгук від ментора</h3>
              <p>
                Після співбесіди ви отримуєте фідбек щодо сильних сторін,
                помилок і тем, які варто підтягнути.
              </p>
            </article>

            <article className="advantage-card">
              <h3>Платформа</h3>
              <p>
                Усе для підготовки в одному місці: профілі, інтервʼюери,
                графік, live coding та структурована взаємодія.
              </p>
            </article>
          </div>

          <button
            type="button"
            className="bottom-btn"
            onClick={() => onNavigate?.("interviewers")}
          >
            Знайти інтервʼюера
          </button>

          <img className="cat-footer" src={catRight} alt="ReadyForIT Cat" />
        </section>
      </main>
    </Layout>
  );
}