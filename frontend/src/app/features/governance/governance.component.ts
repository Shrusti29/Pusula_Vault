import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

interface GovernancePolicy {
  id: string;
  name: string;
  description: string;
  sensitivityLevel: string;
  policyText: string;
  active: boolean;
  enforceOnCreate: boolean;
  enforceOnEdit: boolean;
  requireApproval: boolean;
}

interface RetentionRule {
  id: string;
  name: string;
  description: string;
  retentionDays: number;
  autoArchive: boolean;
  autoDelete: boolean;
  applicableDocumentTypes: string;
}

@Component({
  selector: 'app-governance',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="governance-container">
      <div class="governance-header">
        <h2>Governance & Compliance</h2>
        <div class="header-actions">
          <button class="pv-btn pv-btn-primary" (click)="showCreatePolicyModal.set(true)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Create Policy
          </button>
          <button class="pv-btn pv-btn-secondary" (click)="showCreateRuleModal.set(true)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Create Retention Rule
          </button>
        </div>
      </div>

      <div class="governance-tabs">
        <button [class.active]="activeTab() === 'policies'" (click)="activeTab.set('policies')">Policies</button>
        <button [class.active]="activeTab() === 'rules'" (click)="activeTab.set('rules')">Retention Rules</button>
      </div>

      @if (activeTab() === 'policies') {
        <div class="policies-section">
          <div class="policy-cards">
            @for (policy of policies(); track policy.id) {
              <div class="policy-card">
                <div class="policy-header">
                  <h3>{{ policy.name }}</h3>
                  <span [class]="'pv-badge ' + getSensitivityBadgeClass(policy.sensitivityLevel || $any(policy).sensitivity_level)">
                    {{ policy.sensitivityLevel || $any(policy).sensitivity_level }}
                  </span>
                </div>
                <p class="policy-description">{{ policy.description }}</p>
                <div class="policy-text">{{ policy.policyText || $any(policy).policy_text }}</div>
                <div class="policy-settings">
                  <div class="setting-item">
                    <span class="setting-label">Enforce on Create:</span>
                    <span [class]="'setting-value ' + ((policy.enforceOnCreate ?? $any(policy).enforce_on_create) ? 'enabled' : 'disabled')">
                      {{ (policy.enforceOnCreate ?? $any(policy).enforce_on_create) ? 'Yes' : 'No' }}
                    </span>
                  </div>
                  <div class="setting-item">
                    <span class="setting-label">Enforce on Edit:</span>
                    <span [class]="'setting-value ' + ((policy.enforceOnEdit ?? $any(policy).enforce_on_edit) ? 'enabled' : 'disabled')">
                      {{ (policy.enforceOnEdit ?? $any(policy).enforce_on_edit) ? 'Yes' : 'No' }}
                    </span>
                  </div>
                  <div class="setting-item">
                    <span class="setting-label">Require Approval:</span>
                    <span [class]="'setting-value ' + ((policy.requireApproval ?? $any(policy).require_approval) ? 'enabled' : 'disabled')">
                      {{ (policy.requireApproval ?? $any(policy).require_approval) ? 'Yes' : 'No' }}
                    </span>
                  </div>
                </div>
                <div class="policy-actions">
                  <button class="pv-btn pv-btn-sm pv-btn-secondary" (click)="togglePolicyActive(policy)">
                    {{ policy.active ? 'Deactivate' : 'Activate' }}
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      @if (activeTab() === 'rules') {
        <div class="rules-section">
          <div class="rules-table-wrapper">
            <table class="pv-table">
              <thead>
                <tr>
                  <th>Rule Name</th>
                  <th>Retention Period</th>
                  <th>Auto Archive</th>
                  <th>Auto Delete</th>
                  <th>Applicable Types</th>
                </tr>
              </thead>
              <tbody>
                @for (rule of retentionRules(); track rule.id) {
                  <tr>
                    <td>
                      <div>
                        <div class="rule-name">{{ rule.name }}</div>
                        <div class="rule-description">{{ rule.description }}</div>
                      </div>
                    </td>
                    <td>{{ (rule.retentionDays ?? $any(rule).retention_days) }} days</td>
                    <td>
                      <span [class]="'pv-badge ' + ((rule.autoArchive ?? $any(rule).auto_archive) ? 'pv-badge-green' : 'pv-badge-red')">
                        {{ (rule.autoArchive ?? $any(rule).auto_archive) ? 'Yes' : 'No' }}
                      </span>
                    </td>
                    <td>
                      <span [class]="'pv-badge ' + ((rule.autoDelete ?? $any(rule).auto_delete) ? 'pv-badge-red' : 'pv-badge-green')">
                        {{ (rule.autoDelete ?? $any(rule).auto_delete) ? 'Yes' : 'No' }}
                      </span>
                    </td>
                    <td>{{ rule.applicableDocumentTypes || $any(rule).applicable_document_types }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      @if (showCreatePolicyModal()) {
        <div class="modal-overlay" (click)="showCreatePolicyModal.set(false)">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Create Governance Policy</h3>
              <button class="modal-close" (click)="showCreatePolicyModal.set(false)">×</button>
            </div>
            <form [formGroup]="policyForm" (ngSubmit)="createPolicy()">
              <div class="form-group">
                <label>Policy Name</label>
                <input type="text" formControlName="name" class="pv-input" />
              </div>
              <div class="form-group">
                <label>Description</label>
                <input type="text" formControlName="description" class="pv-input" />
              </div>
              <div class="form-group">
                <label>Sensitivity Level</label>
                <select formControlName="sensitivityLevel" class="pv-input">
                  <option value="PUBLIC">Public</option>
                  <option value="INTERNAL">Internal</option>
                  <option value="CONFIDENTIAL">Confidential</option>
                  <option value="RESTRICTED">Restricted</option>
                  <option value="TOP_SECRET">Top Secret</option>
                </select>
              </div>
              <div class="form-group">
                <label>Policy Text</label>
                <textarea formControlName="policyText" class="pv-input" rows="4"></textarea>
              </div>
              <div class="form-group">
                <label>Settings</label>
                <label class="permission-checkbox">
                  <input type="checkbox" formControlName="enforceOnCreate" />
                  <span>Enforce on Create</span>
                </label>
                <label class="permission-checkbox">
                  <input type="checkbox" formControlName="enforceOnEdit" />
                  <span>Enforce on Edit</span>
                </label>
                <label class="permission-checkbox">
                  <input type="checkbox" formControlName="requireApproval" />
                  <span>Require Approval</span>
                </label>
              </div>
              <div class="modal-footer">
                <button type="button" class="pv-btn pv-btn-secondary" (click)="showCreatePolicyModal.set(false)">Cancel</button>
                <button type="submit" class="pv-btn pv-btn-primary" [disabled]="policyForm.invalid">Create Policy</button>
              </div>
            </form>
          </div>
        </div>
      }

      @if (showCreateRuleModal()) {
        <div class="modal-overlay" (click)="showCreateRuleModal.set(false)">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Create Retention Rule</h3>
              <button class="modal-close" (click)="showCreateRuleModal.set(false)">×</button>
            </div>
            <form [formGroup]="ruleForm" (ngSubmit)="createRule()">
              <div class="form-group">
                <label>Rule Name</label>
                <input type="text" formControlName="name" class="pv-input" />
              </div>
              <div class="form-group">
                <label>Description</label>
                <input type="text" formControlName="description" class="pv-input" />
              </div>
              <div class="form-group">
                <label>Retention Days</label>
                <input type="number" formControlName="retentionDays" class="pv-input" />
              </div>
              <div class="form-group">
                <label>Applicable Document Types</label>
                <input type="text" formControlName="applicableDocumentTypes" class="pv-input" placeholder="WORD,EXCEL,PDF" />
              </div>
              <div class="form-group">
                <label>Settings</label>
                <label class="permission-checkbox">
                  <input type="checkbox" formControlName="autoArchive" />
                  <span>Auto Archive</span>
                </label>
                <label class="permission-checkbox">
                  <input type="checkbox" formControlName="autoDelete" />
                  <span>Auto Delete</span>
                </label>
              </div>
              <div class="modal-footer">
                <button type="button" class="pv-btn pv-btn-secondary" (click)="showCreateRuleModal.set(false)">Cancel</button>
                <button type="submit" class="pv-btn pv-btn-primary" [disabled]="ruleForm.invalid">Create Rule</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .governance-container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }
    .governance-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    .governance-header h2 {
      margin: 0;
      font-size: 1.75rem;
      color: var(--pv-text-primary);
    }
    .header-actions {
      display: flex;
      gap: 0.75rem;
    }
    .governance-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--pv-border);
    }
    .governance-tabs button {
      padding: 0.75rem 1.5rem;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      font-weight: 600;
      color: var(--pv-text-muted);
      transition: all 0.2s;
    }
    .governance-tabs button.active {
      color: var(--pv-accent-blue);
      border-bottom-color: var(--pv-accent-blue);
    }
    .policy-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }
    .policy-card {
      background: var(--pv-bg-card);
      border: 1px solid var(--pv-border);
      border-radius: 12px;
      padding: 1.5rem;
    }
    .policy-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .policy-header h3 {
      margin: 0;
      font-size: 1.25rem;
      color: var(--pv-text-primary);
    }
    .policy-description {
      color: var(--pv-text-muted);
      margin-bottom: 1rem;
    }
    .policy-text {
      background: var(--pv-bg-dark);
      padding: 1rem;
      border-radius: 8px;
      font-size: 0.9rem;
      color: var(--pv-text-secondary);
      margin-bottom: 1rem;
    }
    .policy-settings {
      margin-bottom: 1rem;
    }
    .setting-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--pv-border);
    }
    .setting-label {
      color: var(--pv-text-muted);
    }
    .setting-value.enabled {
      color: #22c55e;
      font-weight: 600;
    }
    .setting-value.disabled {
      color: var(--pv-text-muted);
    }
    .policy-actions {
      display: flex;
      gap: 0.5rem;
    }
    .rules-table-wrapper {
      background: var(--pv-bg-card);
      border: 1px solid var(--pv-border);
      border-radius: 12px;
      overflow: hidden;
    }
    .pv-table {
      width: 100%;
      border-collapse: collapse;
    }
    .pv-table th {
      background: var(--pv-bg-dark);
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      color: var(--pv-text-secondary);
      border-bottom: 1px solid var(--pv-border);
    }
    .pv-table td {
      padding: 1rem;
      border-bottom: 1px solid var(--pv-border);
    }
    .rule-name {
      font-weight: 600;
      color: var(--pv-text-primary);
    }
    .rule-description {
      font-size: 0.85rem;
      color: var(--pv-text-muted);
    }
    .pv-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .pv-badge-green { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
    .pv-badge-red { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
    .pv-badge-blue { background: rgba(14, 165, 233, 0.15); color: #0ea5e9; }
    .pv-badge-yellow { background: rgba(234, 179, 8, 0.15); color: #eab308; }
    .pv-btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.875rem;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }
    .pv-btn-sm { padding: 0.35rem 0.75rem; font-size: 0.8rem; }
    .pv-btn-primary { background: var(--pv-accent-blue); color: white; }
    .pv-btn-primary:hover { background: #0284c7; }
    .pv-btn-secondary { background: var(--pv-bg-dark); color: var(--pv-text-primary); border: 1px solid var(--pv-border); }
    .pv-btn-secondary:hover { background: var(--pv-bg-card-hover); }
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-content {
      background: var(--pv-bg-card);
      border: 1px solid var(--pv-border);
      border-radius: 12px;
      max-width: 600px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid var(--pv-border);
    }
    .modal-header h3 { margin: 0; }
    .modal-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--pv-text-muted);
    }
    .form-group { padding: 1rem 1.5rem; }
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: var(--pv-text-secondary);
    }
    .pv-input {
      width: 100%;
      padding: 0.75rem;
      background: var(--pv-bg-dark);
      border: 1px solid var(--pv-border);
      border-radius: 8px;
      color: var(--pv-text-primary);
      font-family: inherit;
    }
    .permission-checkbox {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      cursor: pointer;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1.5rem;
      border-top: 1px solid var(--pv-border);
    }
  `]
})
export class GovernanceComponent implements OnInit {
  policies = signal<GovernancePolicy[]>([]);
  retentionRules = signal<RetentionRule[]>([]);
  activeTab = signal<'policies' | 'rules'>('policies');
  showCreatePolicyModal = signal(false);
  showCreateRuleModal = signal(false);

  policyForm: FormGroup;
  ruleForm: FormGroup;

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder
  ) {
    this.policyForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      sensitivityLevel: ['INTERNAL', Validators.required],
      policyText: ['', Validators.required],
      enforceOnCreate: [true],
      enforceOnEdit: [true],
      requireApproval: [false]
    });

    this.ruleForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      retentionDays: [2555, Validators.required],
      applicableDocumentTypes: ['WORD,EXCEL,PDF', Validators.required],
      autoArchive: [true],
      autoDelete: [false]
    });
  }

  ngOnInit() {
    this.loadPolicies();
    this.loadRetentionRules();
  }

  loadPolicies() {
    this.apiService.get<GovernancePolicy[]>('/governance/policies').subscribe({
      next: (response) => {
        this.policies.set(response.data);
      },
      error: (error: any) => console.error('Failed to load policies:', error)
    });
  }

  loadRetentionRules() {
    this.apiService.get<RetentionRule[]>('/governance/retention-rules').subscribe({
      next: (response) => {
        this.retentionRules.set(response.data);
      },
      error: (error: any) => console.error('Failed to load retention rules:', error)
    });
  }

  createPolicy() {
    if (this.policyForm.valid) {
      this.apiService.post<GovernancePolicy>('/governance/policies', this.policyForm.value).subscribe({
        next: () => {
          this.showCreatePolicyModal.set(false);
          this.policyForm.reset({
            name: '',
            description: '',
            sensitivityLevel: 'INTERNAL',
            policyText: '',
            enforceOnCreate: true,
            enforceOnEdit: true,
            requireApproval: false
          });
          this.loadPolicies();
        },
        error: (error: any) => console.error('Failed to create policy:', error)
      });
    }
  }

  createRule() {
    if (this.ruleForm.valid) {
      this.apiService.post<RetentionRule>('/governance/retention-rules', this.ruleForm.value).subscribe({
        next: () => {
          this.showCreateRuleModal.set(false);
          this.ruleForm.reset({
            name: '',
            description: '',
            retentionDays: 2555,
            applicableDocumentTypes: 'WORD,EXCEL,PDF',
            autoArchive: true,
            autoDelete: false
          });
          this.loadRetentionRules();
        },
        error: (error: any) => console.error('Failed to create retention rule:', error)
      });
    }
  }

  togglePolicyActive(policy: GovernancePolicy) {
    this.apiService.put<GovernancePolicy>(`/governance/policies/${policy.id}/active`, { active: !policy.active }).subscribe({
      next: () => this.loadPolicies(),
      error: (error: any) => console.error('Failed to toggle policy:', error)
    });
  }

  getSensitivityBadgeClass(level: string): string {
    const classes: Record<string, string> = {
      'PUBLIC': 'pv-badge-green',
      'INTERNAL': 'pv-badge-blue',
      'CONFIDENTIAL': 'pv-badge-yellow',
      'RESTRICTED': 'pv-badge-red',
      'TOP_SECRET': 'pv-badge-red'
    };
    return classes[level] || 'pv-badge-blue';
  }
}
