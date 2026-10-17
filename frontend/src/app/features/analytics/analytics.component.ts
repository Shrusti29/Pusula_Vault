import { Component, inject, signal, computed, OnInit, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { RouterLink, Router } from '@angular/router';
import { ChartConfiguration, ChartOptions, ChartData } from 'chart.js';
import { ApiService } from '../../core/services/api.service';
import {
  OverviewMetrics, ActivityPeriodBucket, HeatmapCell, TopGrantItem, ProgressDigest, GranteeType, Permission
} from '../../core/models/pusula.models';

interface KpiTile {
  key: keyof OverviewMetrics | 'storageUsedGB';
  label: string;
  value: string;
  delta?: string;
  icon: string;
  accent: string;
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule, RouterLink],
  providers: [DatePipe],
  template: `
    <div style="padding: 1.5rem; position: relative; z-index: 1; max-height: calc(100vh - 70px); overflow-y: auto;">
      <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h1 style="font-size: 1.75rem; margin-bottom: 0.25rem;">Analytics & Governance</h1>
          <p style="color: var(--pv-text-muted); font-size: 0.9rem;">Usage insights, activity trends, and access governance overview</p>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <a [routerLink]="['/audit']" class="pv-btn pv-btn-ghost">📋 View Audit Logs</a>
        </div>
      </header>

      <!-- TOP KPI TILES -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
        @for (tile of kpiTiles(); track tile.key) {
          <div class="pv-card" style="padding: 1.25rem; position: relative; overflow: hidden;">
            <div style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; border-radius: 50%; background: {{tile.accent}}18; filter: blur(10px);"></div>
            <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 0.75rem;">
              <div style="width: 38px; height: 38px; border-radius: 10px; background: {{tile.accent}}22; border: 1px solid {{tile.accent}}44; display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">
                {{tile.icon}}
              </div>
              @if (tile.delta) {
                <span class="pv-badge" style="font-size: 0.68rem; background: rgba(34,197,94,0.12); color: #22c55e; border: 1px solid rgba(34,197,94,0.3);">
                  {{tile.delta}}
                </span>
              }
            </div>
            <div style="font-size: 0.75rem; color: var(--pv-text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; margin-bottom: 0.25rem;">
              {{tile.label}}
            </div>
            <div style="font-size: 1.85rem; font-weight: 700; letter-spacing: -0.03em; color: var(--pv-text-primary); line-height: 1;">
              {{tile.value}}
            </div>
          </div>
        }
      </div>

      <!-- ACTIVITY BAR CHART + PERIOD PILLS -->
      <div class="pv-card" style="margin-bottom: 1.5rem; overflow: hidden;">
        <div class="pv-card-header">
          <div>
            <h3 style="font-size: 1rem;">Activity Trends</h3>
            <p style="font-size: 0.78rem; color: var(--pv-text-muted); margin-top: 2px;">Aggregated actions across the platform</p>
          </div>
          <div style="display: flex; gap: 0.25rem; background: var(--pv-bg-dark); padding: 0.2rem; border-radius: var(--pv-radius-md); border: 1px solid var(--pv-border);">
            @for (p of PERIODS; track p.key) {
              <button style="padding: 0.4rem 0.85rem; background: transparent; border: none; border-radius: var(--pv-radius-sm); cursor: pointer; font-size: 0.78rem; font-weight: 600; transition: all var(--pv-transition-fast);"
                [style.background]="activityPeriod() === p.key ? 'linear-gradient(135deg, var(--pv-accent-blue), #0284c7)' : 'transparent'"
                [style.color]="activityPeriod() === p.key ? 'white' : 'var(--pv-text-muted)'"
                [style.box-shadow]="activityPeriod() === p.key ? '0 2px 10px rgba(14,165,233,0.25)' : 'none'"
                (click)="activityPeriod.set(p.key)">
                {{p.label}}
              </button>
            }
          </div>
        </div>
        <div class="pv-card-body" style="height: 320px;">
          <canvas baseChart
            type="bar"
            [data]="activityChartData()"
            [options]="activityChartOpts">
          </canvas>
        </div>
      </div>

      <!-- CALENDAR HEATMAP -->
      <div class="pv-card" style="margin-bottom: 1.5rem; overflow: hidden;">
        <div class="pv-card-header">
          <div>
            <h3 style="font-size: 1rem;">📅 Activity Heatmap</h3>
            <p style="font-size: 0.78rem; color: var(--pv-text-muted); margin-top: 2px;">52-week activity overview · click a day to filter audit log</p>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 0.72rem; color: var(--pv-text-muted);">Less</span>
            @for (lvl of [0,1,2,3,4]; track lvl) {
              <span [style.background]="heatmapLevelColor(lvl)" style="width: 14px; height: 14px; border-radius: 3px; display: inline-block; border: 1px solid rgba(30,58,95,0.4);"></span>
            }
            <span style="font-size: 0.72rem; color: var(--pv-text-muted);">More</span>
          </div>
        </div>
        <div class="pv-card-body" style="overflow-x: auto;">
          <div style="min-width: 780px;">
            <div style="display: grid; grid-template-columns: 30px repeat(53, 1fr); gap: 3px; margin-bottom: 4px;">
              <div></div>
              @for (month of heatmapMonths(); track $index) {
                <div [style.grid-column-start]="month.offset + 1" style="font-size: 0.68rem; color: var(--pv-text-subtle); font-weight: 600;">
                  {{month.label}}
                </div>
              }
            </div>
            <div style="display: grid; grid-template-columns: 30px repeat(53, 1fr); gap: 3px;">
              @for (day of ['M','W','F']; track day; let di = $index) {
                <div style="font-size: 0.62rem; color: var(--pv-text-subtle); font-weight: 600; display: flex; align-items: center;">
                  {{ day === 'M' ? (di === 0 ? 'Mon' : '') : (day === 'W' ? (di === 0 ? 'Wed' : '') : (di === 0 ? 'Fri' : '')) }}
                </div>
              }
              @for (row of heatmapRows(); track row.rowIndex) {
                <div style="display: contents;">
                  <div style="font-size: 0.62rem; color: var(--pv-text-subtle); font-weight: 600; display: flex; align-items: center;">
                    {{ row.dayLabel }}
                  </div>
                  @for (cell of row.cells; track cell.weekIndex) {
                    <div
                      style="width: 100%; aspect-ratio: 1 / 1; border-radius: 3px; cursor: pointer; border: 1px solid transparent; transition: all var(--pv-transition-fast); position: relative;"
                      [style.background]="cell.date ? heatmapLevelColor(cell.level) : 'transparent'"
                      [style.border-color]="hoveredCell() === cell.key ? 'var(--pv-accent-blue)' : 'rgba(30,58,95,0.3)'"
                      [style.opacity]="cell.date ? 1 : 0.1"
                      [style.transform]="hoveredCell() === cell.key ? 'scale(1.35)' : 'scale(1)'"
                      [style.z-index]="hoveredCell() === cell.key ? '10' : '1'"
                      (mouseenter)="hoveredCell.set(cell.key ?? null)"
                      (mouseleave)="hoveredCell.set(null)"
                      (click)="cell.date && gotoAuditWithDate(cell.date)">
                      @if (hoveredCell() === cell.key && cell.date) {
                        <div style="position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); background: var(--pv-bg-elevated); border: 1px solid var(--pv-border); padding: 0.4rem 0.6rem; border-radius: var(--pv-radius-sm); font-size: 0.72rem; white-space: nowrap; z-index: 100; box-shadow: var(--pv-shadow-lg); pointer-events: none;">
                          <div style="font-weight: 600; color: var(--pv-text-primary);">{{cell.date | date:'mediumDate'}}</div>
                          <div style="color: var(--pv-text-muted);">{{cell.count}} activities</div>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- MID 2-COLUMN GRID -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
        <!-- TOP EDITED VERSIONS -->
        <div class="pv-card" style="overflow: hidden;">
          <div class="pv-card-header">
            <div>
              <h3 style="font-size: 1rem;">📝 Top Edited Documents</h3>
              <p style="font-size: 0.78rem; color: var(--pv-text-muted); margin-top: 2px;">Highest version churn</p>
            </div>
          </div>
          <div style="max-height: 360px; overflow-y: auto;">
            <table class="pv-table">
              <thead style="position: sticky; top: 0; z-index: 2;">
                <tr>
                  <th>Document</th>
                  <th style="width: 100px;">Versions</th>
                  <th style="width: 130px;">Last Edited</th>
                </tr>
              </thead>
              <tbody>
                @for (v of topEditedVersions(); track v.documentId; let i = $index) {
                  <tr>
                    <td>
                      <div style="display: flex; align-items: center; gap: 0.6rem;">
                        <div style="width: 26px; height: 26px; border-radius: 6px; background: linear-gradient(135deg, rgba(14,165,233,0.2), rgba(139,92,246,0.2)); border: 1px solid var(--pv-border); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.72rem; color: var(--pv-text-secondary);">
                          {{i + 1}}
                        </div>
                        <div>
                          <div style="font-size: 0.85rem; font-weight: 600; color: var(--pv-text-primary); line-height: 1.3;">{{v.title}}</div>
                          <div style="font-size: 0.68rem; color: var(--pv-text-subtle); font-family: monospace;">#{{v.documentId.slice(0,8)}}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="pv-badge pv-badge-amber" style="font-size: 0.72rem;">v×{{v.versionsCount}}</span>
                    </td>
                    <td style="font-size: 0.78rem; color: var(--pv-text-muted);">
                      {{v.lastEdited | date:'MM-dd HH:mm'}}
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="3" style="text-align: center; padding: 2rem; color: var(--pv-text-subtle); font-size: 0.85rem;">
                      No version data yet.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- TOP ACTIVE CONTRIBUTORS -->
        <div class="pv-card" style="overflow: hidden;">
          <div class="pv-card-header">
            <div>
              <h3 style="font-size: 1rem;">🏆 Top Contributors</h3>
              <p style="font-size: 0.78rem; color: var(--pv-text-muted); margin-top: 2px;">Most active editors this cycle</p>
            </div>
          </div>
          <div style="padding: 1.5rem;">
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              @for (c of topContributors(); track c.userId; let i = $index) {
                <div>
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <div style="width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, var(--pv-accent-teal), var(--pv-accent-blue)); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; color: white;">
                        {{c.fullName.charAt(0).toUpperCase()}}
                      </div>
                      <div>
                        <div style="font-size: 0.85rem; font-weight: 600; color: var(--pv-text-primary);">{{c.fullName}}</div>
                        <span class="pv-badge" style="font-size: 0.62rem; background: rgba(14,165,233,0.12); color: var(--pv-accent-blue); border: 1px solid rgba(14,165,233,0.3); margin-top: 2px;">{{c.role}}</span>
                      </div>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-size: 0.95rem; font-weight: 700; color: var(--pv-text-primary);">{{c.edits}}</div>
                      <div style="font-size: 0.68rem; color: var(--pv-text-subtle);">edits</div>
                    </div>
                  </div>
                  <div style="height: 8px; background: var(--pv-bg-dark); border-radius: 999px; border: 1px solid var(--pv-border); overflow: hidden;">
                    <div style="height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--pv-accent-teal), var(--pv-accent-blue)); transition: width var(--pv-transition-slow);"
                      [style.width]="contributorPct(c.edits) + '%'"></div>
                  </div>
                </div>
              } @empty {
                <div style="text-align: center; padding: 2rem; color: var(--pv-text-subtle); font-size: 0.85rem;">
                  No contributor data yet.
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- BOTTOM 2-COLUMN GRID -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
        <!-- ACCESS GOVERNANCE -->
        <div class="pv-card" style="overflow: hidden;">
          <div class="pv-card-header">
            <div>
              <h3 style="font-size: 1rem;">🔐 Access Governance · Last 30 days</h3>
              <p style="font-size: 0.78rem; color: var(--pv-text-muted); margin-top: 2px;">Permission grants, denials and suspicious activity</p>
            </div>
          </div>
          <div style="padding: 1.25rem;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 1.25rem;">
              <div style="background: var(--pv-bg-dark); border: 1px solid var(--pv-border); border-radius: var(--pv-radius-md); padding: 0.85rem;">
                <div style="font-size: 0.7rem; color: var(--pv-accent-teal); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; margin-bottom: 0.5rem;">✓ Top Grants</div>
                <div style="max-height: 200px; overflow-y: auto;">
                  <table class="pv-table" style="font-size: 0.75rem;">
                    <thead style="background: transparent !important;">
                      <tr>
                        <th style="font-size: 0.65rem; padding: 0.3rem 0.5rem;">Grantee</th>
                        <th style="font-size: 0.65rem; padding: 0.3rem 0.5rem;">Resource</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (g of topGrants(); track g.id) {
                        <tr>
                          <td style="padding: 0.4rem 0.5rem;">
                            <div style="font-weight: 600; color: var(--pv-text-primary); font-size: 0.75rem;">{{g.granteeLabel}}</div>
                            <div style="font-size: 0.62rem; color: var(--pv-text-subtle);">{{g.granteeType}}</div>
                          </td>
                          <td style="padding: 0.4rem 0.5rem; font-size: 0.72rem; color: var(--pv-text-secondary);">
                            {{g.resourceLabel}}
                          </td>
                        </tr>
                      } @empty {
                        <tr><td colspan="2" style="padding: 1rem; text-align: center; color: var(--pv-text-subtle); font-size: 0.72rem;">No grants</td></tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
              <div style="background: var(--pv-bg-dark); border: 1px solid var(--pv-border); border-radius: var(--pv-radius-md); padding: 0.85rem;">
                <div style="font-size: 0.7rem; color: var(--pv-accent-red); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; margin-bottom: 0.5rem;">✗ Top Denied</div>
                <div style="max-height: 200px; overflow-y: auto;">
                  <table class="pv-table" style="font-size: 0.75rem;">
                    <thead style="background: transparent !important;">
                      <tr>
                        <th style="font-size: 0.65rem; padding: 0.3rem 0.5rem;">Actor</th>
                        <th style="font-size: 0.65rem; padding: 0.3rem 0.5rem;">Attempts</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (d of topDenied(); track d.actorId + d.resourceLabel) {
                        <tr>
                          <td style="padding: 0.4rem 0.5rem;">
                            <div style="font-weight: 600; color: var(--pv-text-primary); font-size: 0.75rem;">{{d.actorName}}</div>
                            <div style="font-size: 0.62rem; color: var(--pv-text-subtle);">{{d.action}} · {{d.resourceLabel}}</div>
                          </td>
                          <td style="padding: 0.4rem 0.5rem;">
                            <span class="pv-badge pv-badge-red" style="font-size: 0.62rem;">×{{d.count}}</span>
                          </td>
                        </tr>
                      } @empty {
                        <tr><td colspan="2" style="padding: 1rem; text-align: center; color: var(--pv-text-subtle); font-size: 0.72rem;">No denials</td></tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div>
              <div style="font-size: 0.72rem; color: var(--pv-accent-red); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.35rem;">
                ⚠ Suspicious Access Events
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 180px; overflow-y: auto;">
                @for (s of suspiciousAccess(); track s.actorId + s.at) {
                  <div style="display: flex; align-items: flex-start; gap: 0.6rem; padding: 0.65rem 0.85rem; background: rgba(220,38,38,0.06); border: 1px solid rgba(220,38,38,0.2); border-radius: var(--pv-radius-md);">
                    <span class="pv-badge pv-badge-red" style="font-size: 0.6rem; flex-shrink: 0;">ALERT</span>
                    <div style="flex: 1; min-width: 0;">
                      <div style="font-size: 0.78rem; font-weight: 600; color: var(--pv-text-primary); margin-bottom: 2px;">
                        <span style="color: var(--pv-accent-red);">{{s.actorName}}</span>
                        <span style="color: var(--pv-text-muted);"> on </span>
                        <span style="color: var(--pv-text-secondary);">{{s.resourceLabel}}</span>
                      </div>
                      <div style="font-size: 0.7rem; color: var(--pv-text-muted); line-height: 1.4;">{{s.reason}}</div>
                    </div>
                    <div style="font-size: 0.68rem; color: var(--pv-text-subtle); flex-shrink: 0;">
                      {{s.at | date:'MM-dd HH:mm'}}
                    </div>
                  </div>
                } @empty {
                  <div style="padding: 1rem; text-align: center; color: var(--pv-accent-teal); font-size: 0.8rem;">
                    ✓ No suspicious activity detected.
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- AI PROGRESS SYNTHESIZER -->
        <div class="pv-card" style="overflow: hidden;">
          <div class="pv-card-header">
            <div>
              <h3 style="font-size: 1rem;">🤖 AI Progress Synthesizer</h3>
              <p style="font-size: 0.78rem; color: var(--pv-text-muted); margin-top: 2px;">Machine-generated executive digest of platform activity</p>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <div style="display: flex; background: var(--pv-bg-dark); padding: 0.2rem; border-radius: var(--pv-radius-md); border: 1px solid var(--pv-border);">
                @for (pp of PROGRESS_PERIODS; track pp.key) {
                  <button style="padding: 0.35rem 0.7rem; background: transparent; border: none; border-radius: var(--pv-radius-sm); cursor: pointer; font-size: 0.75rem; font-weight: 600; transition: all var(--pv-transition-fast);"
                    [style.background]="progressPeriod() === pp.key ? 'linear-gradient(135deg, rgba(139,92,246,0.9), #7c3aed)' : 'transparent'"
                    [style.color]="progressPeriod() === pp.key ? 'white' : 'var(--pv-text-muted)'"
                    [style.box-shadow]="progressPeriod() === pp.key ? '0 2px 10px rgba(139,92,246,0.25)' : 'none'"
                    (click)="progressPeriod.set(pp.key)">
                    {{pp.label}}
                  </button>
                }
              </div>
              <button class="pv-btn pv-btn-primary" (click)="generateProgress()" [disabled]="progressLoading()">
                @if (progressLoading()) { ⏳ Generating... } @else { ✨ Generate }
              </button>
            </div>
          </div>
          <div style="padding: 1.5rem; max-height: 520px; overflow-y: auto;">
            @if (!progressDigest() && !progressLoading()) {
              <div style="text-align: center; padding: 3rem 1rem;">
                <div style="font-size: 3rem; margin-bottom: 0.75rem;">🧠</div>
                <div style="color: var(--pv-text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
                  Select a period above and click <strong style="color: var(--pv-accent-purple);">Generate</strong> to synthesize a progress digest.
                </div>
                <div style="font-size: 0.75rem; color: var(--pv-text-subtle);">
                  Powered by activity, version history, and access traces.
                </div>
              </div>
            }

            @if (progressLoading()) {
              <div style="text-align: center; padding: 3rem 1rem;">
                <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid var(--pv-border); border-top-color: var(--pv-accent-purple); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                <div style="margin-top: 1rem; color: var(--pv-text-muted); font-size: 0.85rem;">Analyzing activity signals…</div>
              </div>
            }

            @if (progressDigest()) {
              <div class="fade-in">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--pv-border);">
                  <div>
                    <div style="font-size: 0.72rem; color: var(--pv-text-subtle); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Reporting Period</div>
                    <div style="font-size: 0.9rem; color: var(--pv-text-primary); font-weight: 600;">
                      {{progressDigest()?.startDate | date:'mediumDate'}} → {{progressDigest()?.endDate | date:'mediumDate'}}
                      <span class="pv-badge pv-badge-purple" style="margin-left: 0.5rem; font-size: 0.62rem;">{{progressDigest()?.period}}</span>
                    </div>
                  </div>
                </div>

                <div style="margin-bottom: 1.5rem;">
                  <div style="font-size: 0.85rem; font-weight: 700; color: var(--pv-accent-blue); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.65rem; display: flex; align-items: center; gap: 0.35rem;">
                    📌 Observed Activity:
                  </div>
                  <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.45rem;">
                    @for (bullet of progressDigest()?.observedActivity || []; track $index) {
                      <li style="display: flex; gap: 0.5rem; align-items: flex-start;">
                        <span style="color: var(--pv-accent-teal); flex-shrink: 0;">▸</span>
                        <span style="font-size: 0.82rem; color: var(--pv-text-secondary); line-height: 1.5;">{{bullet}}</span>
                      </li>
                    } @empty {
                      <li style="color: var(--pv-text-subtle); font-size: 0.82rem; font-style: italic;">No structured activity bullets returned.</li>
                    }
                  </ul>
                </div>

                <div>
                  <div style="font-size: 0.85rem; font-weight: 700; color: var(--pv-accent-purple); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.65rem; display: flex; align-items: center; gap: 0.35rem;">
                    🤖 AI-Generated Summary:
                  </div>
                  <div style="background: linear-gradient(135deg, rgba(139,92,246,0.08), rgba(14,165,233,0.06)); border: 1px solid rgba(139,92,246,0.2); border-radius: var(--pv-radius-md); padding: 1rem 1.1rem;">
                    <p style="font-size: 0.88rem; color: var(--pv-text-secondary); line-height: 1.75; letter-spacing: 0.005em;">
                      {{ progressDigest()?.aiGeneratedSummary || 'Summary not available for this period.' }}
                    </p>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class AnalyticsComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  readonly PERIODS = [
    { key: 'day' as const, label: 'Day' },
    { key: 'week' as const, label: 'Week' },
    { key: 'month' as const, label: 'Month' }
  ];
  readonly PROGRESS_PERIODS = [
    { key: 'daily' as const, label: 'Daily' },
    { key: 'weekly' as const, label: 'Weekly' },
    { key: 'monthly' as const, label: 'Monthly' }
  ];

  readonly activityPeriod = signal<'day' | 'week' | 'month'>('week');
  readonly progressPeriod = signal<'daily' | 'weekly' | 'monthly'>('weekly');

  readonly overview = signal<OverviewMetrics | null>(null);
  readonly activity = signal<ActivityPeriodBucket[]>([]);
  readonly heatmap = signal<HeatmapCell[]>([]);
  readonly topEditedVersions = signal<Array<{ documentId: string; title: string; versionsCount: number; lastEdited: string; }>>([]);
  readonly topContributors = signal<Array<{ userId: string; fullName: string; role: string; edits: number; }>>([]);
  readonly topGrants = signal<TopGrantItem[]>([]);
  readonly topDenied = signal<Array<{ actorId: string; actorName: string; resourceLabel: string; action: string; count: number; }>>([]);
  readonly suspiciousAccess = signal<Array<{ actorId: string; actorName: string; resourceLabel: string; reason: string; at: string; }>>([]);
  readonly progressDigest = signal<ProgressDigest | null>(null);
  readonly progressLoading = signal(false);

  readonly hoveredCell = signal<string | null>(null);

  readonly activityChartOpts: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#cbd5e1',
          font: { size: 11, weight: 600 as const },
          boxWidth: 12,
          boxHeight: 12,
          padding: 16,
          usePointStyle: true,
          pointStyle: 'rectRounded'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(3,7,18,0.98)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: '#1e3a5f',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        titleFont: { size: 12, weight: 700 as const },
        bodyFont: { size: 12 }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(30,58,95,0.2)' },
        ticks: { color: '#64748b', font: { size: 10 } },
        border: { display: false }
      },
      y: {
        grid: { color: 'rgba(30,58,95,0.2)' },
        ticks: { color: '#64748b', font: { size: 10 } },
        border: { display: false },
        beginAtZero: true
      }
    }
  };

  readonly kpiTiles = computed<KpiTile[]>(() => {
    const o = this.overview();
    const gb = o ? (o.storageUsedBytes / 1_000_000_000) : 0;
    return [
      { key: 'totalUsers', label: 'Total Users', value: o?.totalUsers.toLocaleString() ?? '—', icon: '👥', accent: 'var(--pv-accent-blue)' },
      { key: 'totalDocuments', label: 'Documents', value: o?.totalDocuments.toLocaleString() ?? '—', icon: '📄', accent: 'var(--pv-accent-teal)' },
      { key: 'totalFiles', label: 'Files', value: o?.totalFiles.toLocaleString() ?? '—', icon: '📎', accent: 'var(--pv-accent-amber)' },
      { key: 'storageUsedGB', label: 'Storage (GB)', value: o ? gb.toFixed(2) : '—', icon: '💾', accent: 'var(--pv-accent-purple)' },
      { key: 'docsCreatedToday', label: 'Created Today', value: o?.docsCreatedToday.toLocaleString() ?? '—', delta: '+new', icon: '✨', accent: 'var(--pv-accent-blue)' },
      { key: 'docsModifiedToday', label: 'Modified Today', value: o?.docsModifiedToday.toLocaleString() ?? '—', icon: '✏️', accent: 'var(--pv-accent-amber)' },
      { key: 'aiInteractionsLast7d', label: 'AI Interactions (7d)', value: o?.aiInteractionsLast7d.toLocaleString() ?? '—', icon: '🤖', accent: 'var(--pv-accent-purple)' },
      { key: 'activeUsersLast7d', label: 'Active Users (7d)', value: o?.activeUsersLast7d.toLocaleString() ?? '—', icon: '⚡', accent: 'var(--pv-accent-teal)' }
    ];
  });

  readonly activityChartData = computed<ChartData<'bar'>>(() => {
    const data = this.activity();
    const labels = data.map(d => this.formatBucketLabel(d.date));
    return {
      labels,
      datasets: [
        {
          label: 'Created',
          data: data.map(d => d.created),
          backgroundColor: 'rgba(20,184,166,0.75)',
          borderRadius: 4,
          borderSkipped: false,
          maxBarThickness: 18
        },
        {
          label: 'Edited',
          data: data.map(d => d.edited),
          backgroundColor: 'rgba(14,165,233,0.75)',
          borderRadius: 4,
          borderSkipped: false,
          maxBarThickness: 18
        },
        {
          label: 'Viewed',
          data: data.map(d => d.viewed),
          backgroundColor: 'rgba(139,92,246,0.7)',
          borderRadius: 4,
          borderSkipped: false,
          maxBarThickness: 18
        },
        {
          label: 'Uploaded',
          data: data.map(d => d.uploaded),
          backgroundColor: 'rgba(245,158,11,0.7)',
          borderRadius: 4,
          borderSkipped: false,
          maxBarThickness: 18
        },
        {
          label: 'Downloaded',
          data: data.map(d => d.downloaded),
          backgroundColor: 'rgba(220,38,38,0.65)',
          borderRadius: 4,
          borderSkipped: false,
          maxBarThickness: 18
        },
        {
          label: 'AI',
          data: data.map(d => d.aiInteractions),
          backgroundColor: 'rgba(168,85,247,0.7)',
          borderRadius: 4,
          borderSkipped: false,
          maxBarThickness: 18
        }
      ]
    };
  });

  readonly maxEdits = computed(() => {
    const list = this.topContributors();
    return list.length ? Math.max(...list.map(c => c.edits), 1) : 1;
  });

  contributorPct(edits: number): number {
    return Math.round((edits / this.maxEdits()) * 100);
  }

  heatmapLevelColor(level: number): string {
    const palette = [
      'rgba(30, 58, 95, 0.25)',
      'rgba(14, 165, 233, 0.35)',
      'rgba(14, 165, 233, 0.6)',
      'rgba(20, 184, 166, 0.75)',
      'rgba(34, 197, 94, 0.9)'
    ];
    return palette[Math.min(level, 4)] || palette[0];
  }

  heatmapMonths(): { label: string; offset: number }[] {
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - 52 * 7);
    const result: { label: string; offset: number }[] = [];
    const months: Record<string, number> = {};
    for (let w = 0; w < 53; w++) {
      const d = new Date(start);
      d.setDate(start.getDate() + w * 7);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!months[key]) {
        months[key] = w;
        result.push({
          label: d.toLocaleDateString('en-US', { month: 'short' }),
          offset: w
        });
      }
    }
    return result;
  }

  heatmapRows(): { rowIndex: number; dayLabel: string; cells: HeatmapCell[]; }[] {
    const days = ['Mon', '', 'Wed', '', 'Fri', '', ''];
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - 52 * 7);
    const startDow = (start.getDay() + 6) % 7;
    const adjustedStart = new Date(start);
    adjustedStart.setDate(start.getDate() - startDow);

    const heatmapMap: Record<string, HeatmapCell> = {};
    for (const hc of this.heatmap()) heatmapMap[hc.date.slice(0, 10)] = hc;

    const rows: { rowIndex: number; dayLabel: string; cells: HeatmapCell[]; }[] = [];
    for (let row = 0; row < 7; row++) {
      const cells: HeatmapCell[] = [];
      for (let w = 0; w < 53; w++) {
        const d = new Date(adjustedStart);
        d.setDate(adjustedStart.getDate() + row + w * 7);
        const key = d.toISOString().slice(0, 10);
        const isBefore = d < new Date(new Date(start).setHours(0, 0, 0, 0));
        const isAfter = d > new Date(new Date(end).setHours(23, 59, 59, 999));
        const base = heatmapMap[key] || { date: key, count: 0, level: 0 as 0 };
        cells.push({
          date: (isBefore || isAfter) ? '' : key,
          count: base.count,
          level: (isBefore || isAfter) ? 0 as 0 : base.level,
          weekIndex: w,
          key: `${row}-${w}`
        } as any);
      }
      rows.push({ rowIndex: row, dayLabel: days[row], cells });
    }
    return rows;
  }

  ngOnInit(): void {
    this.refreshOverview();
    this.refreshActivity();
    this.refreshHeatmap();
    this.refreshEdited();
    this.refreshContributors();
    this.refreshAccess();
  }

  @HostListener('document:click', ['$event'])
  _docClick() {
  }

  private formatBucketLabel(date: string): string {
    const d = new Date(date);
    const p = this.activityPeriod();
    if (p === 'day') return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (p === 'week') return d.toLocaleDateString('en-US', { weekday: 'short' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  gotoAuditWithDate(iso: string): void {
    this.router.navigate(['/audit'], { queryParams: { date: iso } });
  }

  generateProgress(): void {
    this.progressLoading.set(true);
    this.api.progressDigest(this.progressPeriod()).subscribe({
      next: (r) => {
        this.progressDigest.set(r);
        this.progressLoading.set(false);
      },
      error: () => this.progressLoading.set(false)
    });
  }

  private refreshOverview(): void {
    this.api.analyticsOverview().subscribe(o => this.overview.set(o));
  }

  private refreshActivity(): void {
    this.api.analyticsActivity(this.activityPeriod()).subscribe(a => this.activity.set(a));
  }

  private refreshHeatmap(): void {
    this.api.analyticsHeatmap().subscribe(h => this.heatmap.set(h));
  }

  private refreshEdited(): void {
    this.api.topEditedVersions(10).subscribe(v => this.topEditedVersions.set(v));
  }

  private refreshContributors(): void {
    this.api.topContributors(10).subscribe(c => this.topContributors.set(c));
  }

  private refreshAccess(): void {
    this.api.topGrantsLast30(10).subscribe(g => this.topGrants.set(g));
    this.api.topDeniedLast30(10).subscribe(d => this.topDenied.set(d));
    this.api.suspiciousAccess().subscribe(s => this.suspiciousAccess.set(s));
  }
}
