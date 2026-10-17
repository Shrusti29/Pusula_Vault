import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="landing-page">
      <nav class="landing-nav">
        <div class="landing-nav-content">
          <a href="#" class="landing-logo">
            Pusula<span>Vault</span>
          </a>
          <div class="landing-nav-links">
            <a href="#about" class="landing-nav-link">About</a>
            <button (click)="router.navigate(['/login'])" class="pv-btn pv-btn-outline">Login</button>
            <button (click)="router.navigate(['/login'])" class="pv-btn pv-btn-primary">Get Started</button>
          </div>
        </div>
      </nav>

      <section class="landing-hero">
        <div class="landing-content">
          <h1 class="landing-title">Pusula Vault</h1>
          <p class="landing-subtitle">
            Secure enterprise knowledge management platform powered by artificial intelligence. 
            We not only fix for today but also for what's next.
          </p>
          <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
            <button (click)="router.navigate(['/login'])" class="pv-btn pv-btn-primary" style="padding: 1rem 2rem; font-size: 1rem;">
              Get Started
            </button>
          </div>
        </div>
      </section>

      <section class="landing-features">
        <div class="feature-card">
          <div class="feature-icon">🎯</div>
          <h3 class="feature-title">Think Big</h3>
          <p class="feature-description">
            Our AI consultants prioritize impactful projects that drive real business value and sustainable growth.
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">⚡</div>
          <h3 class="feature-title">Expertise & Offering</h3>
          <p class="feature-description">
            Fostering adaptive methodologies with cutting-edge AI infrastructure for enterprise solutions.
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">🚀</div>
          <h3 class="feature-title">Fast Growth</h3>
          <p class="feature-description">
            Next generation technology shaping the future with AI innovations and advanced capabilities.
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">🌱</div>
          <h3 class="feature-title">Sustainability</h3>
          <p class="feature-description">
            Striking balance between addressing operational challenges and taking impactful decisions.
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">🔒</div>
          <h3 class="feature-title">Secure & Private</h3>
          <p class="feature-description">
            Enterprise-grade security with advanced encryption and access control for your sensitive data.
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">📊</div>
          <h3 class="feature-title">Analytics & Insights</h3>
          <p class="feature-description">
            Powerful analytics and AI-driven insights to help you make data-driven decisions.
          </p>
        </div>
      </section>

      <section id="about" style="padding: 5rem 2rem 6rem;">
        <div class="landing-content" style="text-align: center;">
          <h2 style="font-size: 2rem; margin-bottom: 0.75rem; color: var(--pv-text-primary);">Contact the team</h2>
          <p style="font-size: 1.05rem; color: var(--pv-text-secondary); line-height: 1.7;">
            info&#64;pulaint.com<br>
            Mumbai, India
          </p>
        </div>
      </section>

      <footer style="padding: 3rem 2rem; background: var(--pv-bg-deep); border-top: 1px solid var(--pv-border);">
        <div class="landing-content">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem;">
            <div>
              <h4 style="color: var(--pv-text-primary); margin-bottom: 1rem;">Pusula Vault</h4>
              <p style="color: var(--pv-text-muted); font-size: 0.9rem;">
                Enterprise knowledge management powered by AI.
              </p>
            </div>
            <div>
              <h4 style="color: var(--pv-text-primary); margin-bottom: 1rem;">Quick Links</h4>
              <ul style="list-style: none; padding: 0;">
                <li style="margin-bottom: 0.5rem;"><a href="#about" style="color: var(--pv-text-muted); text-decoration: none;">About</a></li>
                <li style="margin-bottom: 0.5rem;"><a (click)="router.navigate(['/login'])" style="color: var(--pv-text-muted); text-decoration: none; cursor: pointer;">Login</a></li>
              </ul>
            </div>
            <div>
              <h4 style="color: var(--pv-text-primary); margin-bottom: 1rem;">Contact</h4>
              <p style="color: var(--pv-text-muted); font-size: 0.9rem;">
                info&#64;pulaint.com<br>
                Mumbai, India
              </p>
            </div>
          </div>
          <div style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--pv-border); text-align: center; color: var(--pv-text-muted); font-size: 0.85rem;">
            © 2024 Pusula Vault. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .landing-page {
      min-height: 100vh;
      background: var(--pv-bg-dark);
    }
  `]
})
export class LandingComponent {
  constructor(public router: Router) {}
}
