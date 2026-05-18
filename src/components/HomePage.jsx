import "../styles/home.css";

import Layout from "./layout/Layout";

import catLeft from "../assets/images/cat-left.png";
import catRight from "../assets/images/cat-right.png";
import appPreview from "../assets/images/app-preview.png";

export default function HomePage({ onLogout }) {
  return (
    <Layout onLogout={onLogout}>
      <main className="main-page">
        <section className="hero-section">
          <img className="cat-left" src={catLeft} alt="ReadyForIT Cat" />

          <img className="cat-right" src={catRight} alt="ReadyForIT Cat" />

          <div className="hero-text">
            <p className="hero-label">Готові до технічного інтервʼю?</p>

            <h1>
              Ласкаво просимо до <span>ReadyForIT</span>
            </h1>

            <p className="hero-description">
              Платформа для проведення пробних технічних інтервʼю. Отримуйте
              реальний досвід, практикуйте live coding, проходьте співбесіди з
              перевіреними експертами та отримуйте фідбек від менторів.
            </p>

            <div className="hero-actions">
              <a className="primary-btn" href="/interviewers">
                Переглянути інтервʼюерів
              </a>

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
                Особистий профіль, історія активності та індивідуальні
                можливості відповідно до ролі користувача.
              </p>
            </article>

            <article className="advantage-card">
              <h3>Практичний перший досвід</h3>
              <p>
                Реалістичний формат технічної співбесіди без стресу та страху
                перед реальним інтервʼю.
              </p>
            </article>

            <article className="advantage-card">
              <h3>Графік</h3>
              <p>
                Плануйте пробні інтервʼю у зручний для вас час та ефективно
                організовуйте підготовку.
              </p>
            </article>

            <article className="advantage-card">
              <h3>Перевірені експерти</h3>
              <p>
                Інтервʼю проводять спеціалісти, які працюють у сфері IT та
                мають досвід технічних співбесід.
              </p>
            </article>

            <article className="advantage-card">
              <h3>Відгук від ментора</h3>
              <p>
                Після проходження інтервʼю ви отримуєте детальний фідбек щодо
                сильних сторін і того, що варто покращити.
              </p>
            </article>

            <article className="advantage-card">
              <h3>Платформа</h3>
              <p>
                Усе необхідне в одному місці: профілі, інтервʼюери, live coding
                та підготовка до технічних співбесід.
              </p>
            </article>
          </div>

          <a className="bottom-btn" href="/interviewers">
            Знайти інтервʼюера
          </a>
        </section>
      </main>
    </Layout>
  );
}