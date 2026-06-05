/**
 * RMIT Survey Engine v1.0
 * ========================
 * Drop-in survey renderer for RMIT Vietnam single-file HTML surveys.
 *
 * USAGE:
 *   1. Define window.SURVEY_CONFIG in a <script> block BEFORE including this file.
 *   2. Add <script src="survey-engine.js"></script> in <head> or <body>.
 *   3. The engine renders the complete survey into <body> automatically.
 *
 * CONFIG SCHEMA — see survey_template.html for a full annotated example.
 */
(function (cfg) {
  'use strict';

  if (!cfg || typeof cfg !== 'object') {
    console.error('[SurveyEngine] window.SURVEY_CONFIG is not defined.');
    return;
  }

  // ─────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────
  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function storageKey(suffix) {
    return (cfg.storageKey || 'survey') + '_' + suffix;
  }

  // ─────────────────────────────────────────────
  // CSS
  // ─────────────────────────────────────────────
  const CSS = `
:root{--primary:#000054;--primary-light:#1a1a7e;--accent:#e4002b;--bg:#f5f6fa;--card:#ffffff;--text:#2c3e50;--text-light:#6c7a89;--border:#dce1e8;--success:#27ae60;--warning:#f39c12;}
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:var(--bg);color:var(--text);line-height:1.6;}
.se-container{max-width:860px;margin:0 auto;padding:20px;}

/* Header */
.se-header{background:var(--primary);color:#fff;border-radius:12px;margin-bottom:24px;text-align:center;overflow:hidden;}
.se-banner{width:100%;height:clamp(140px,28vw,240px);object-fit:cover;object-position:center 40%;display:block;}
.se-header-content{background:linear-gradient(180deg,rgba(0,0,84,.72) 0%,rgba(0,0,84,.96) 40%,var(--primary) 100%);padding:clamp(20px,4vw,36px) clamp(16px,4vw,36px) clamp(24px,4vw,40px);margin-top:-4px;}
.se-header-content::before{content:'';position:absolute;top:-30px;left:0;right:0;height:30px;background:linear-gradient(to top,var(--primary),transparent);pointer-events:none;}
.se-header h1{font-size:clamp(15px,2.5vw,22px);font-weight:700;margin-bottom:8px;letter-spacing:.5px;}
.se-header .se-subtitle{font-size:clamp(12px,1.6vw,14px);opacity:.88;max-width:700px;margin:12px auto 0;line-height:1.7;}
.se-header .se-org{display:inline-block;background:var(--accent);color:#fff;padding:4px 16px;border-radius:20px;font-size:12px;font-weight:600;margin-bottom:16px;}

/* Intro box */
.se-intro{background:var(--card);border-radius:12px;padding:24px 28px;margin-bottom:20px;border:1px solid var(--border);}
.se-intro h3{color:var(--primary);font-size:15px;margin-bottom:10px;}
.se-intro p,.se-intro li{font-size:13.5px;color:var(--text);line-height:1.75;}
.se-intro ul{padding-left:18px;margin-top:8px;}

/* Scale legend */
.se-scale-legend{display:flex;gap:0;margin:12px 0 0;flex-wrap:wrap;}
.se-scale-item{flex:1;min-width:60px;text-align:center;background:#f0f2f8;border:1px solid var(--border);padding:8px 4px;}
.se-scale-item:first-child{border-radius:6px 0 0 6px;}
.se-scale-item:last-child{border-radius:0 6px 6px 0;}
.se-scale-item .num{font-size:15px;font-weight:700;color:var(--primary);display:block;}
.se-scale-item .lbl{font-size:10px;color:var(--text-light);line-height:1.3;display:block;}

/* Email/Date row */
.se-meta-row{background:var(--card);padding:16px 24px;border-radius:10px;margin-bottom:20px;display:flex;align-items:center;gap:12px;border:1px solid var(--border);flex-wrap:wrap;}
.se-meta-row label{font-weight:600;font-size:14px;white-space:nowrap;}
.se-meta-row input{border:1px solid var(--border);padding:8px 14px;border-radius:6px;font-size:14px;outline:none;transition:border .2s;flex:1;min-width:160px;}
.se-meta-row input:focus{border-color:var(--primary);}

/* Progress */
.se-progress{background:var(--card);border-radius:10px;padding:14px 24px;margin-bottom:20px;border:1px solid var(--border);display:flex;align-items:center;gap:14px;}
.se-progress span{font-size:13px;font-weight:600;white-space:nowrap;}
.se-progress-bar{flex:1;height:8px;background:#e8eaef;border-radius:4px;overflow:hidden;}
.se-progress-fill{height:100%;background:linear-gradient(90deg,var(--primary),var(--accent));border-radius:4px;transition:width .4s ease;width:0%;}

/* Consent gate */
.se-consent-gate{background:#fff8e1;border:1px solid #ffe082;border-radius:10px;padding:20px 24px;margin-bottom:20px;display:none;text-align:center;}
.se-consent-gate p{color:#795548;font-size:14px;}

/* Section */
.se-section{background:var(--card);border-radius:12px;margin-bottom:20px;border:1px solid var(--border);overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.04);}
.se-section-header{background:var(--primary);color:#fff;padding:16px 24px;font-size:15px;font-weight:700;letter-spacing:.3px;}
.se-section-header small{display:block;font-weight:400;font-size:12px;opacity:.8;margin-top:4px;}
.se-section-body{padding:24px;}
.se-instruction{font-size:13px;color:var(--text-light);margin-bottom:20px;padding:10px 14px;background:#f0f2f8;border-radius:8px;border-left:3px solid var(--primary);}

/* Question */
.se-qblock{margin-bottom:22px;padding-bottom:18px;border-bottom:1px solid #f0f2f5;}
.se-qblock:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0;}
.se-qlabel{font-size:14px;font-weight:600;margin-bottom:12px;display:flex;gap:8px;align-items:flex-start;}
.se-qlabel.req-error{color:var(--accent);}
.se-qnum{background:var(--primary);color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;margin-top:1px;}

/* Radio / Checkbox options */
.se-options{display:flex;flex-wrap:wrap;gap:8px 16px;padding-left:32px;}
.se-options.col{flex-direction:column;gap:6px;}
.se-options.cols-2{display:grid;grid-template-columns:repeat(2,1fr);gap:6px 12px;}
.se-options.cols-3{display:grid;grid-template-columns:repeat(3,1fr);gap:6px 10px;}
.se-options.cols-4{display:grid;grid-template-columns:repeat(4,1fr);gap:6px 8px;}
.se-options label{display:flex;align-items:center;gap:6px;font-size:13.5px;cursor:pointer;padding:6px 12px;border-radius:6px;border:1px solid transparent;transition:all .15s;}
.se-options label:hover{background:#f0f2f8;border-color:var(--border);}
.se-options input[type=radio],.se-options input[type=checkbox]{accent-color:var(--primary);width:16px;height:16px;}
.se-options input[type=checkbox]{appearance:none;-webkit-appearance:none;border:2px solid var(--border);border-radius:50%;cursor:pointer;position:relative;background:#fff;transition:all .15s;flex-shrink:0;}
.se-options input[type=checkbox]:checked{background:var(--primary);border-color:var(--primary);}
.se-options input[type=checkbox]:checked::after{content:'';position:absolute;width:6px;height:6px;background:#fff;border-radius:50%;top:50%;left:50%;transform:translate(-50%,-50%);}
.se-options.req-error{outline:2px dashed var(--accent);border-radius:6px;padding:6px;}
.se-checkbox-note{font-size:12px;color:var(--text-light);padding-left:32px;margin-bottom:4px;font-style:italic;}

/* Other text input */
.se-other-input{margin-top:6px;padding-left:32px;display:none;}
.se-other-input input{border:1px solid var(--border);padding:7px 12px;border-radius:6px;font-size:13px;width:100%;max-width:380px;outline:none;transition:border .2s;}
.se-other-input input:focus{border-color:var(--primary);}

/* Free text input */
.se-text-input{margin-left:32px;margin-top:8px;}
.se-text-input input{width:100%;max-width:400px;padding:8px 14px;border:1px solid var(--border);border-radius:6px;font-size:14px;outline:none;transition:border .2s;}
.se-text-input input:focus{border-color:var(--primary);}

/* Likert scale */
.se-likert{display:flex;align-items:center;gap:0;padding-left:32px;margin-top:8px;flex-wrap:wrap;}
.se-likert .lk-end{font-size:11px;color:var(--text-light);min-width:90px;line-height:1.3;}
.se-likert .lk-end.left{text-align:right;padding-right:10px;}
.se-likert .lk-end.right{text-align:left;padding-left:10px;}
.se-likert-opts{display:flex;gap:0;}
.se-likert-opts label{display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;padding:8px 12px;border-radius:6px;transition:background .15s;}
.se-likert-opts label:hover{background:#f0f2f8;}
.se-likert-opts label span{font-size:12px;font-weight:700;color:var(--text-light);}
.se-likert-opts input[type=radio]{accent-color:var(--primary);width:18px;height:18px;}
.se-likert.req-error .se-likert-opts{outline:2px dashed var(--accent);border-radius:6px;}

/* Submit area */
.se-submit{text-align:center;padding:30px 0;}
.se-submit .btn{min-width:220px;padding:14px 36px;font-size:16px;}
.se-submit p{margin-top:12px;font-size:13px;color:var(--text-light);}

/* Buttons */
.btn{display:inline-flex;align-items:center;gap:6px;padding:12px 28px;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;text-decoration:none;}
.btn-primary{background:var(--primary);color:#fff;}
.btn-primary:hover{background:var(--primary-light);transform:translateY(-1px);}
.btn-accent{background:var(--accent);color:#fff;}
.btn-accent:hover{opacity:.9;}
.btn-outline{background:transparent;color:var(--primary);border:2px solid var(--primary);}
.btn-outline:hover{background:var(--primary);color:#fff;}
.btn-success{background:var(--success);color:#fff;}
.btn-sm{padding:8px 16px;font-size:13px;}
.btn[disabled]{opacity:.6;cursor:not-allowed;}

/* Custom questions section */
.se-custom-section{display:none;}
.se-custom-section.has-questions{display:block;}
.se-remove-btn{background:none;border:none;color:var(--accent);cursor:pointer;font-size:18px;padding:2px 6px;border-radius:4px;margin-left:8px;line-height:1;}
.se-remove-btn:hover{background:#fde8ec;}

/* Thank you */
.se-thankyou{display:none;text-align:center;padding:60px 30px;background:var(--card);border-radius:12px;border:1px solid var(--border);}
.se-thankyou h2{color:var(--primary);margin-bottom:12px;}
.se-thankyou p{color:var(--text-light);font-size:15px;}

/* Admin toggle / panel */
.se-admin-toggle{position:fixed;bottom:24px;right:24px;z-index:1000;}
.se-admin-panel{display:none;position:fixed;top:0;right:0;width:420px;height:100vh;background:var(--card);box-shadow:-4px 0 20px rgba(0,0,0,.12);z-index:999;overflow-y:auto;padding:28px;}
.se-admin-panel.active{display:block;}
.se-admin-panel h3{font-size:18px;margin-bottom:20px;color:var(--primary);}
.se-form-group{margin-bottom:16px;}
.se-form-group label{display:block;font-size:13px;font-weight:600;margin-bottom:6px;}
.se-form-group input,.se-form-group select,.se-form-group textarea{width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:6px;font-size:13px;outline:none;}
.se-form-group textarea{min-height:80px;resize:vertical;}
.se-admin-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.3);z-index:998;}
.se-admin-overlay.active{display:block;}
.se-config-box{background:#f8f9fc;border:1px solid var(--border);border-radius:8px;padding:14px;margin-bottom:16px;}
.se-config-box h5{font-size:13px;margin-bottom:8px;color:var(--primary);}
.se-config-box input{width:100%;padding:7px 10px;border:1px solid var(--border);border-radius:5px;font-size:12px;font-family:monospace;}
.se-config-box .hint{font-size:11px;color:var(--text-light);margin-top:6px;line-height:1.5;}
.se-status-badge{display:inline-flex;align-items:center;gap:5px;font-size:12px;padding:4px 12px;border-radius:12px;font-weight:600;}
.se-status-badge.online{background:#e8f8ef;color:#27ae60;}
.se-status-badge.offline{background:#fde8ec;color:#e74c3c;}
.se-status-badge .dot{width:7px;height:7px;border-radius:50%;}
.se-status-badge.online .dot{background:#27ae60;}
.se-status-badge.offline .dot{background:#e74c3c;}
.se-hr{margin:16px 0;border:none;border-top:1px solid var(--border);}

/* Validation modal */
.se-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:3000;display:none;align-items:center;justify-content:center;animation:seFadeIn .2s ease;}
.se-modal-overlay.show{display:flex;}
.se-modal{background:#fff;border-radius:14px;padding:32px 28px 24px;max-width:380px;width:90%;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,.25);animation:sePopIn .25s cubic-bezier(.34,1.56,.64,1);}
.se-modal-icon{font-size:44px;margin-bottom:12px;}
.se-modal h3{color:var(--primary);font-size:17px;margin-bottom:10px;}
.se-modal p{color:var(--text);font-size:14px;line-height:1.6;}
.se-modal-close{margin-top:20px;background:var(--accent);color:#fff;border:none;padding:10px 32px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:opacity .15s;}
.se-modal-close:hover{opacity:.85;}
@keyframes seFadeIn{from{opacity:0}to{opacity:1}}
@keyframes sePopIn{from{transform:scale(.8);opacity:0}to{transform:scale(1);opacity:1}}

/* Toast */
.se-toast{position:fixed;top:24px;right:24px;background:var(--success);color:#fff;padding:14px 24px;border-radius:8px;font-size:14px;font-weight:600;z-index:2000;display:none;box-shadow:0 4px 12px rgba(0,0,0,.15);max-width:340px;}
.se-toast.show{display:block;animation:seSlideIn .3s ease;}
@keyframes seSlideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}

/* Balloons */
#se-balloons{position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;display:none;}
.se-balloon{position:absolute;bottom:-140px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;animation:seBalloonRise linear forwards;}
.se-balloon::after{content:'';position:absolute;bottom:-18px;left:50%;transform:translateX(-50%);width:2px;height:22px;background:rgba(0,0,0,0.25);border-radius:1px;}
@keyframes seBalloonRise{0%{bottom:-140px;opacity:1;}85%{opacity:0.9;}100%{bottom:110%;opacity:0;}}

/* Spinner */
.se-spinner{display:inline-block;width:18px;height:18px;border:2.5px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:seSpin .6s linear infinite;vertical-align:middle;margin-right:6px;}
@keyframes seSpin{to{transform:rotate(360deg)}}

@media(max-width:640px){
  body{padding-bottom:80px;}
  .se-container{padding:12px;}
  .se-header h1{font-size:15px;}
  .se-section-body{padding:16px;}
  .se-likert{flex-wrap:wrap;padding-left:0;}
  .se-likert .lk-end.left{min-width:auto;width:100%;text-align:left;padding:0 0 4px;}
  .se-likert .lk-end.right{min-width:auto;width:100%;text-align:right;padding:4px 0 0;}
  .se-likert-opts{width:100%;justify-content:center;}
  .se-options{padding-left:0;}
  .se-options.cols-3,.se-options.cols-4{grid-template-columns:repeat(2,1fr);}
  .se-options.cols-2{grid-template-columns:1fr;}
  .se-other-input{padding-left:0;}
  .se-admin-panel{width:100%;max-width:100%;}
  .se-admin-toggle{bottom:16px;right:16px;}
  .se-scale-legend{gap:2px;}
  .se-scale-item .lbl{font-size:9px;}
}`;

  // ─────────────────────────────────────────────
  // HTML BUILDERS
  // ─────────────────────────────────────────────

  function buildHeader() {
    const banner = cfg.banner || 'rmit-banner.jpg';
    const org = cfg.orgBadge ? `<div class="se-org">${cfg.orgBadge}</div>` : '';
    const title = cfg.headerTitle ? `<h1>${cfg.headerTitle}</h1>` : '';
    const detail = cfg.headerDetail ? `<h1 style="font-size:clamp(13px,2vw,17px);font-weight:400;margin-top:6px;">${cfg.headerDetail}</h1>` : '';
    const subtitle = cfg.headerSubtitle ? `<p class="se-subtitle" style="margin-top:16px;">${cfg.headerSubtitle}</p>` : '';
    return `
<div class="se-header">
  <img src="${esc(banner)}" alt="Banner" class="se-banner" onerror="this.style.display='none'">
  <div class="se-header-content">
    ${org}${title}${detail}${subtitle}
  </div>
</div>`;
  }

  function buildIntroBox() {
    if (!cfg.introBox) return '';
    const ib = cfg.introBox;
    const title = ib.title ? `<h3>${ib.title}</h3>` : '';
    const scaleLegend = buildScaleLegend();
    return `<div class="se-intro">${title}${ib.html || ''}${scaleLegend}</div>`;
  }

  function buildScaleLegend() {
    if (!cfg.scaleLegend || !cfg.scaleLegend.length) return '';
    const items = cfg.scaleLegend.map(s =>
      `<div class="se-scale-item"><span class="num">${s.num}</span><span class="lbl">${esc(s.label)}</span></div>`
    ).join('');
    return `<div class="se-scale-legend">${items}</div>`;
  }

  function buildMetaRow() {
    const showEmail   = cfg.showEmail !== false;
    const showDate    = cfg.showDate  !== false;
    const showCompany = cfg.showCompanyName === true;
    if (!showEmail && !showDate && !showCompany) return '';

    const companyLabel       = esc(cfg.companyNameLabel       || 'Tên công ty / Tổ chức:');
    const companyPlaceholder = esc(cfg.companyNamePlaceholder || 'Nhập tên công ty hoặc tổ chức...');
    const requireCompany     = cfg.requireCompanyName !== false && showCompany ? ' required' : '';
    const companyField = showCompany
      ? `<label for="se_company">${companyLabel}</label>
         <input type="text" id="se_company" name="company_name" placeholder="${companyPlaceholder}" style="min-width:220px;"${requireCompany}>`
      : '';

    const emailLabel       = esc(cfg.emailLabel       || 'Email:');
    const emailPlaceholder = esc(cfg.emailPlaceholder || 'example@email.com');
    const requireEmail     = cfg.requireEmail === true ? ' required' : '';
    const emailField = showEmail
      ? `<label for="se_email">${emailLabel}</label>
         <input type="email" id="se_email" name="respondent_email" placeholder="${emailPlaceholder}" style="min-width:200px;"${requireEmail}>`
      : '';

    const dateLabel = esc(cfg.dateLabel || 'Ngày khảo sát:');
    const dateRow = showDate
      ? `<div class="se-meta-row" style="margin-top:-12px;"><label for="se_date">${dateLabel}</label><input type="date" id="se_date" name="survey_date" required></div>`
      : '';

    const topRow = (showCompany || showEmail)
      ? `<div class="se-meta-row">${companyField}${emailField}</div>`
      : '';

    return topRow + dateRow;
  }

  function buildProgress() {
    return `
<div class="se-progress" id="se-progress-wrap">
  <span id="se-progress-text">0%</span>
  <div class="se-progress-bar"><div class="se-progress-fill" id="se-progress-fill"></div></div>
</div>`;
  }

  function buildConsentGate() {
    if (!cfg.requireConsent) return '';
    return `<div class="se-consent-gate" id="se-consent-gate">
  <p>⚠ Cảm ơn Anh/Chị đã xem qua khảo sát. Vì Anh/Chị không đồng ý tham gia, biểu mẫu sẽ không được gửi đi.
  Nếu muốn tham gia, vui lòng chọn lại <strong>"Có"</strong> ở câu đầu tiên.</p>
</div>`;
  }

  // ── Section: Demographics (radio / checkbox / text) ──
  function buildDemographicsSection(sec) {
    const questions = (sec.questions || []).map((q, qi) => buildDemographicQuestion(q, qi + 1)).join('');
    return `
<div class="se-section" data-section="${esc(sec.id)}">
  <div class="se-section-header">
    ${sec.sectionLabel ? esc(sec.sectionLabel) + ': ' : ''}${sec.title || ''}
    ${sec.subtitle ? `<small>${sec.subtitle}</small>` : ''}
  </div>
  <div class="se-section-body">
    ${sec.instruction ? `<div class="se-instruction">${sec.instruction}</div>` : ''}
    ${questions}
  </div>
</div>`;
  }

  function buildDemographicQuestion(q, num) {
    let inputHtml = '';
    const l = q.layout;
    const layoutClass = l === 'column' ? ' col'
      : (l === 2 || l === '2') ? ' cols-2'
      : (l === 3 || l === '3') ? ' cols-3'
      : (l === 4 || l === '4') ? ' cols-4'
      : '';

    if (q.type === 'radio') {
      const opts = (q.options || []).map((opt, oi) => {
        const val = typeof opt === 'object' ? opt.value : opt;
        const lbl = typeof opt === 'object' ? opt.label : opt;
        const isFirst = oi === 0;
        const required = q.required && isFirst ? ' required' : '';
        return `<label><input type="radio" name="${esc(q.id)}" value="${esc(val)}"${required}> ${lbl}</label>`;
      }).join('');
      inputHtml = `<div class="se-options${layoutClass}">${opts}</div>`;

      if (q.otherField) {
        inputHtml += `<div class="se-other-input" id="${esc(q.id)}_other_wrap">
          <input type="text" name="${esc(q.otherField.name)}" placeholder="${esc(q.otherField.placeholder || 'Vui lòng ghi rõ...')}">
        </div>`;
      }
    } else if (q.type === 'checkbox') {
      const checkboxNote = q.checkboxNote
        ? `<p class="se-checkbox-note">${q.checkboxNote}</p>`
        : '<p class="se-checkbox-note">Có thể chọn nhiều đáp án</p>';
      const opts = (q.options || []).map(opt => {
        const val = typeof opt === 'object' ? opt.value : opt;
        const lbl = typeof opt === 'object' ? opt.label : opt;
        return `<label><input type="checkbox" name="${esc(q.id)}_items" value="${esc(val)}"> ${lbl}</label>`;
      }).join('');
      inputHtml = `${checkboxNote}<div class="se-options${layoutClass}">${opts}</div>`;

      if (q.otherField) {
        inputHtml += `<div class="se-other-input" id="${esc(q.id)}_other_wrap">
          <input type="text" name="${esc(q.otherField.name)}" placeholder="${esc(q.otherField.placeholder || 'Vui lòng ghi rõ...')}">
        </div>`;
      }
    } else if (q.type === 'text' || q.type === 'number') {
      const inputType = q.type === 'number' ? 'number' : 'text';
      const minAttr   = q.min  != null ? ` min="${q.min}"`   : '';
      const maxAttr   = q.max  != null ? ` max="${q.max}"`   : '';
      const stepAttr  = q.step != null ? ` step="${q.step}"` : '';
      inputHtml = `<div class="se-text-input">
        <input type="${inputType}" name="${esc(q.id)}" placeholder="${esc(q.placeholder || '')}"${minAttr}${maxAttr}${stepAttr} ${q.required ? 'required' : ''}>
      </div>`;
    }

    return `<div class="se-qblock" id="block_${esc(q.id)}">
  <div class="se-qlabel"><span class="se-qnum">${num}</span><span>${q.text}</span></div>
  ${inputHtml}
</div>`;
  }

  // ── Section: Likert ──
  function buildLikertSection(sec, sectionIndex) {
    const scale = sec.scale || 5;
    const leftLabel = sec.leftLabel || (scale === 5 ? 'Hoàn toàn<br>không đồng ý' : 'Hoàn toàn<br>không đồng ý');
    const rightLabel = sec.rightLabel || (scale === 5 ? 'Hoàn toàn<br>đồng ý' : 'Hoàn toàn<br>đồng ý');

    const questions = (sec.questions || []).map((q, qi) => {
      const num = qi + 1;
      const text = typeof q === 'string' ? q : q.text;
      const varName = `${sec.varPrefix}_${num}`;
      const options = Array.from({ length: scale }, (_, i) => {
        const val = i + 1;
        const required = i === 0 ? ' required' : '';
        return `<label><span>${val}</span><input type="radio" name="${esc(varName)}" value="${val}"${required}></label>`;
      }).join('');

      return `<div class="se-qblock" id="block_${esc(varName)}">
  <div class="se-qlabel"><span class="se-qnum">${num}</span><span>${text}</span></div>
  <div class="se-likert">
    <span class="lk-end left">${leftLabel}</span>
    <div class="se-likert-opts">${options}</div>
    <span class="lk-end right">${rightLabel}</span>
  </div>
</div>`;
    }).join('');

    return `
<div class="se-section" data-section="${esc(sec.id)}">
  <div class="se-section-header">
    ${sec.sectionLabel ? esc(sec.sectionLabel) + ': ' : ''}${sec.title || ''}
    ${sec.subtitle ? `<small>${sec.subtitle}</small>` : ''}
  </div>
  <div class="se-section-body">
    ${sec.instruction ? `<div class="se-instruction">${sec.instruction}</div>` : ''}
    ${questions}
  </div>
</div>`;
  }

  // ── Section: Raw HTML (escape hatch) ──
  function buildHtmlSection(sec) {
    return `
<div class="se-section" data-section="${esc(sec.id)}">
  <div class="se-section-header">
    ${sec.sectionLabel ? esc(sec.sectionLabel) + ': ' : ''}${sec.title || ''}
    ${sec.subtitle ? `<small>${sec.subtitle}</small>` : ''}
  </div>
  <div class="se-section-body">${sec.html || ''}</div>
</div>`;
  }

  // ── Custom questions section (admin-added) ──
  function buildCustomSection() {
    if (cfg.showCustomQuestionsAdmin === false) return '';
    return `
<div class="se-section se-custom-section" id="se-custom-section">
  <div class="se-section-header">CÂU HỎI BỔ SUNG<small>Các câu hỏi được thêm bởi quản trị viên</small></div>
  <div class="se-section-body" id="se-custom-container"></div>
</div>`;
  }

  function buildSubmit() {
    const label = cfg.submitLabel || '&#10003;&ensp;GỬI KHẢO SÁT';
    const note = cfg.submitNote || '';
    return `<div class="se-submit">
  <button type="submit" class="btn btn-primary" id="se-submit-btn">${label}</button>
  ${note ? `<p>${note}</p>` : ''}
</div>`;
  }

  function buildThankYou() {
    const icon = cfg.thankYouIcon || '&#10004;';
    const heading = cfg.thankYouTitle || 'CẢM ƠN BẠN RẤT NHIỀU VỀ SỰ HỢP TÁC!';
    const body = cfg.thankYouBody || 'Phản hồi của bạn đã được ghi nhận thành công.<br>Dữ liệu sẽ được sử dụng phục vụ nghiên cứu.';
    return `<div class="se-thankyou" id="se-thankyou">
  <div style="font-size:48px;margin-bottom:16px;">${icon}</div>
  <h2>${heading}</h2>
  <p style="margin-top:12px;">${body}</p>
  <button class="btn btn-outline" style="margin-top:24px;" onclick="SurveyEngine.reset()">Điền khảo sát mới</button>
  <button class="btn btn-success" style="margin-top:24px;margin-left:8px;" onclick="SurveyEngine.exportCSV()">&#8681; Xuất CSV</button>
</div>`;
  }

  function buildAdminPanel() {
    const customQBlock = cfg.showCustomQuestionsAdmin !== false ? `
<hr class="se-hr">
<p style="font-size:13px;color:var(--text-light);margin-bottom:20px;">Thêm câu hỏi mới vào khảo sát. Câu hỏi sẽ xuất hiện trong phần "Câu hỏi bổ sung".</p>
<div class="se-form-group">
  <label>Nội dung câu hỏi <span style="color:var(--accent)">*</span></label>
  <textarea id="se-admin-q" placeholder="Nhập nội dung câu hỏi..."></textarea>
</div>
<div class="se-form-group">
  <label>Loại câu hỏi</label>
  <select id="se-admin-type">
    <option value="likert">Thang đo Likert (1–5)</option>
    <option value="radio">Trắc nghiệm (chọn 1)</option>
    <option value="text">Câu trả lời tự do</option>
  </select>
</div>
<div class="se-form-group" id="se-admin-opts-wrap" style="display:none;">
  <label>Các lựa chọn (mỗi dòng 1 lựa chọn)</label>
  <textarea id="se-admin-opts" placeholder="Lựa chọn A&#10;Lựa chọn B&#10;Lựa chọn C"></textarea>
</div>
<div style="display:flex;gap:8px;margin-top:20px;">
  <button class="btn btn-primary btn-sm" onclick="SurveyEngine.addCustomQuestion()">&#10010; Thêm câu hỏi</button>
  <button class="btn btn-outline btn-sm" onclick="SurveyEngine.closeAdmin()">Đóng</button>
</div>
<hr class="se-hr">
<h4 style="font-size:14px;margin-bottom:12px;">Câu hỏi đã thêm</h4>
<div id="se-custom-list" style="font-size:13px;color:var(--text-light);"><em>Chưa có câu hỏi bổ sung nào.</em></div>` : '';

    return `
<div class="se-admin-overlay" id="se-admin-overlay" onclick="SurveyEngine.closeAdmin()"></div>
<div class="se-admin-panel" id="se-admin-panel">
  <h3>&#9881; Quản trị khảo sát</h3>

  <!-- Google Sheets Config -->
  <div class="se-config-box">
    <h5>&#9729; Chế độ trực tuyến (Google Sheets)</h5>
    <div style="margin-bottom:8px;">
      <span class="se-status-badge" id="se-online-badge"><span class="dot"></span><span id="se-status-text">--</span></span>
    </div>
    <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">Google Apps Script URL:</label>
    <input type="text" id="se-gs-url" placeholder="https://script.google.com/macros/s/AKfyc.../exec">
    <div style="display:flex;gap:6px;margin-top:8px;">
      <button class="btn btn-primary btn-sm" style="font-size:12px;padding:5px 12px;" onclick="SurveyEngine.saveGoogleConfig()">Lưu &amp; Kết nối</button>
      <button class="btn btn-outline btn-sm" style="font-size:12px;padding:5px 12px;" onclick="SurveyEngine.disconnectGoogle()">Ngắt kết nối</button>
    </div>
    <div class="hint" style="font-size:11px;color:var(--text-light);margin-top:8px;line-height:1.5;">
      &#9432; Chỉnh sửa thẻ <code>&lt;meta name="google-script-url"&gt;</code> trong HTML để đặt URL vĩnh viễn (ưu tiên cao hơn cài đặt này).
      <button class="btn btn-sm" style="font-size:11px;padding:3px 10px;margin-top:6px;background:#f0f2f8;color:var(--primary);border:1px solid var(--border);" onclick="SurveyEngine.showAppsScript()">&#128203; Xem mã Apps Script</button>
    </div>
  </div>

  ${customQBlock}

  <hr class="se-hr">
  <h4 style="font-size:14px;margin-bottom:12px;">Dữ liệu khảo sát</h4>
  <p style="font-size:12px;color:var(--text-light);margin-bottom:12px;">Đã ghi nhận: <strong id="se-response-count">0</strong> phản hồi</p>
  <div style="display:flex;gap:8px;flex-wrap:wrap;">
    <button class="btn btn-success btn-sm" onclick="SurveyEngine.exportCSV()">&#8681; Xuất CSV</button>
    <button class="btn btn-outline btn-sm" onclick="SurveyEngine.exportJSON()">&#8681; Xuất JSON</button>
    <button class="btn btn-sm" style="background:#e74c3c;color:#fff;" onclick="SurveyEngine.clearData()">&#10005; Xóa tất cả</button>
  </div>
</div>
<div class="se-admin-toggle">
  <button class="btn btn-accent btn-sm" onclick="SurveyEngine.toggleAdmin()" title="Quản trị câu hỏi">&#9881; Quản trị</button>
</div>`;
  }

  function buildToast() {
    return `<div class="se-toast" id="se-toast"></div>`;
  }

  // ─────────────────────────────────────────────
  // ASSEMBLE FULL PAGE
  // ─────────────────────────────────────────────
  function assembleHTML() {
    const sections = (cfg.sections || []).map((sec, idx) => {
      if (sec.type === 'demographics') return buildDemographicsSection(sec, idx);
      if (sec.type === 'likert')       return buildLikertSection(sec, idx);
      if (sec.type === 'html')         return buildHtmlSection(sec);
      return '';
    }).join('');

    return `
<div class="se-container">
  ${buildHeader()}
  ${buildIntroBox()}
  ${buildProgress()}
  ${buildConsentGate()}
  <form id="se-form" novalidate>
    ${buildMetaRow()}
    ${sections}
    ${buildCustomSection()}
    ${buildSubmit()}
  </form>
  ${buildThankYou()}
</div>
${buildAdminPanel()}
${buildToast()}
<div id="se-balloons"></div>
<div class="se-modal-overlay" id="se-val-modal">
  <div class="se-modal">
    <div class="se-modal-icon" id="se-val-icon">⚠️</div>
    <h3 id="se-val-title"></h3>
    <p id="se-val-body"></p>
    <button class="se-modal-close" onclick="document.getElementById('se-val-modal').classList.remove('show')">OK</button>
  </div>
</div>`;
  }

  // ─────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────
  let _responses = [];
  let _customQuestions = [];
  let _googleScriptUrl = '';
  let _adminAuthenticated = false;

  // ─────────────────────────────────────────────
  // COMPUTE HEADERS (for Apps Script template)
  // ─────────────────────────────────────────────
  function computeHeaders() {
    if (cfg.sheetHeaders) return cfg.sheetHeaders;
    const h = ['timestamp'];
    if (cfg.showCompanyName) h.push('company_name');
    h.push('respondent_email', 'survey_date');
    (cfg.sections || []).forEach(sec => {
      if (sec.type === 'demographics') {
        (sec.questions || []).forEach(q => {
          if (q.type === 'checkbox') {
            h.push(q.id + '_items');
          } else {
            h.push(q.id);
          }
          if (q.otherField) h.push(q.otherField.name);
        });
      } else if (sec.type === 'likert') {
        const count = (sec.questions || []).length;
        for (let i = 1; i <= count; i++) h.push(`${sec.varPrefix}_${i}`);
      }
    });
    return h;
  }

  // ─────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────
  function init() {
    // Inject CSS
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    // Set page title if not already set by HTML
    if (cfg.title && document.title === '') document.title = cfg.title;

    // Wait for DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run);
    } else {
      run();
    }
  }

  function run() {
    // Inject HTML into body
    document.body.innerHTML = assembleHTML();

    // Load state from localStorage
    _responses = JSON.parse(localStorage.getItem(storageKey('responses')) || '[]');
    _customQuestions = JSON.parse(localStorage.getItem(storageKey('custom_questions')) || '[]');
    _adminAuthenticated = sessionStorage.getItem(storageKey('admin_auth')) === 'true';

    // Resolve google script URL (meta tag has highest priority)
    const metaUrl = document.querySelector('meta[name="google-script-url"]');
    const metaUrlVal = (metaUrl && metaUrl.getAttribute('content')) || '';
    _googleScriptUrl = metaUrlVal || localStorage.getItem(storageKey('google_url')) || '';

    // Set today's date
    const dateEl = document.getElementById('se_date');
    if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];

    // Admin panel: show current URL
    const urlEl = document.getElementById('se-gs-url');
    if (urlEl) urlEl.value = _googleScriptUrl;

    updateOnlineStatus();
    renderCustomQuestions();
    updateResponseCount();

    // Admin type change
    const adminTypeEl = document.getElementById('se-admin-type');
    if (adminTypeEl) {
      adminTypeEl.addEventListener('change', function () {
        const w = document.getElementById('se-admin-opts-wrap');
        if (w) w.style.display = this.value === 'radio' ? 'block' : 'none';
      });
    }

    // "Other" toggles for radio questions with otherField
    (cfg.sections || []).forEach(sec => {
      if (sec.type !== 'demographics') return;
      (sec.questions || []).forEach(q => {
        if (!q.otherField) return;
        const triggerValue = (q.options || []).find(o =>
          (typeof o === 'object' && (o.triggerOther || o.value === 'Khác'))
          || (typeof o === 'string' && o === 'Khác')
        );
        if (!triggerValue) return;
        document.querySelectorAll(`input[name="${q.id}"]`).forEach(radio => {
          radio.addEventListener('change', function () {
            const wrap = document.getElementById(`${q.id}_other_wrap`);
            if (wrap) wrap.style.display = this.value === 'Khác' ? 'block' : 'none';
          });
        });
      });
    });

    // Consent gate
    if (cfg.requireConsent) {
      document.querySelectorAll('input[name="consent"]').forEach(r => {
        r.addEventListener('change', function () {
          const gate = document.getElementById('se-consent-gate');
          const form = document.getElementById('se-form');
          if (gate && form) {
            if (this.value === 'Không') {
              gate.style.display = 'block';
              form.querySelectorAll('input,select,textarea').forEach(el => {
                if (el.name !== 'consent') el.disabled = true;
              });
            } else {
              gate.style.display = 'none';
              form.querySelectorAll('input,select,textarea').forEach(el => { el.disabled = false; });
            }
          }
        });
      });
    }

    // Progress tracking
    const form = document.getElementById('se-form');
    if (form) {
      form.addEventListener('change', updateProgress);
      form.addEventListener('submit', handleSubmit);
      updateProgress();
    }
  }

  // ─────────────────────────────────────────────
  // PROGRESS
  // ─────────────────────────────────────────────
  function updateProgress() {
    const form = document.getElementById('se-form');
    if (!form) return;
    const allRequired = form.querySelectorAll('[required]');
    const uniqueNames = new Set();
    allRequired.forEach(el => uniqueNames.add(el.name));
    let answered = 0;
    uniqueNames.forEach(name => {
      const checked = form.querySelector(`input[name="${name}"]:checked`);
      const textEl = form.querySelector(`input[name="${name}"]`);
      if (checked || (textEl && textEl.type === 'date' && textEl.value)) answered++;
    });
    const pct = uniqueNames.size > 0 ? Math.round((answered / uniqueNames.size) * 100) : 0;
    const fill = document.getElementById('se-progress-fill');
    const text = document.getElementById('se-progress-text');
    if (fill) fill.style.width = pct + '%';
    if (text) text.textContent = pct + '%';
  }

  // ─────────────────────────────────────────────
  // SUBMIT
  // ─────────────────────────────────────────────
  function showValidationModal(icon, title, body, fieldEl) {
    const overlay = document.getElementById('se-val-modal');
    if (!overlay) { alert(title + '\n' + body); return; }
    document.getElementById('se-val-icon').textContent  = icon;
    document.getElementById('se-val-title').textContent = title;
    document.getElementById('se-val-body').textContent  = body;
    overlay.classList.add('show');
    overlay.onclick = function(ev){ if(ev.target===overlay) overlay.classList.remove('show'); };
    if (fieldEl) {
      fieldEl.scrollIntoView({ behavior:'smooth', block:'center' });
      fieldEl.style.outline = '2px solid var(--accent)';
      fieldEl.focus();
      setTimeout(() => { fieldEl.style.outline = ''; }, 2500);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;

    // Validate number fields — range & integer
    const numberInputs = form.querySelectorAll('input[type="number"]');
    for (const el of numberInputs) {
      if (!el.value) continue; // blank handled by required check below
      const val = Number(el.value);
      const min = el.min !== '' ? Number(el.min) : null;
      const max = el.max !== '' ? Number(el.max) : null;
      if (!Number.isInteger(val)) {
        showValidationModal('🔢',
          'Vui lòng nhập số nguyên / Please enter a whole number',
          `"${el.placeholder || el.name}" — Giá trị phải là số nguyên (không có phần thập phân). / Value must be a whole number (no decimal).`,
          el);
        return;
      }
      if (min !== null && val < min) {
        showValidationModal('⚠️',
          'Giá trị ngoài phạm vi / Value out of range',
          `"${el.placeholder || el.name}" — Giá trị tối thiểu là ${min}. / Minimum value is ${min}.`,
          el);
        return;
      }
      if (max !== null && val > max) {
        showValidationModal('⚠️',
          'Giá trị ngoài phạm vi / Value out of range',
          `"${el.placeholder || el.name}" — Giá trị tối đa là ${max}. / Maximum value is ${max}.`,
          el);
        return;
      }
    }

    // Validate required fields
    const allRequired = form.querySelectorAll('[required]');
    let firstMissing = null;
    const checkedNames = new Set();
    allRequired.forEach(el => {
      if (el.type === 'radio') {
        if (!checkedNames.has(el.name)) {
          checkedNames.add(el.name);
          if (!form.querySelector(`input[name="${el.name}"]:checked`)) {
            if (!firstMissing) firstMissing = el.closest('.se-qblock') || el.closest('.se-meta-row');
          }
        }
      } else if (!el.value) {
        if (!firstMissing) firstMissing = el.closest('.se-qblock') || el.closest('.se-meta-row');
      }
    });

    if (firstMissing) {
      firstMissing.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstMissing.style.boxShadow = '0 0 0 2px var(--accent)';
      setTimeout(() => { firstMissing.style.boxShadow = ''; }, 2000);
      showToast(cfg.requiredMessage || 'Vui lòng trả lời tất cả các câu hỏi bắt buộc.', '#e74c3c');
      return;
    }

    // Collect data — handle checkboxes (multiple values) by joining with "; "
    const formData = new FormData(form);
    const data = { timestamp: new Date().toISOString() };
    const checkboxMap = {};
    for (const [key, value] of formData.entries()) {
      if (key.endsWith('_items')) {
        // Checkbox multi-value: accumulate
        const base = key.slice(0, -6); // remove "_items" suffix
        checkboxMap[key] = checkboxMap[key] ? checkboxMap[key] + '; ' + value : value;
      } else {
        data[key] = value;
      }
    }
    // Merge checkbox values
    Object.keys(checkboxMap).forEach(k => { data[k] = checkboxMap[k]; });

    // Save locally
    _responses.push(data);
    localStorage.setItem(storageKey('responses'), JSON.stringify(_responses));
    updateResponseCount();

    const submitBtn = document.getElementById('se-submit-btn');
    if (_googleScriptUrl) {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="se-spinner"></span>Đang gửi...';
      }
      sendToGoogleSheets(data).then(ok => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = (cfg.submitLabel || '&#10003;&ensp;GỬI KHẢO SÁT');
        }
        showComplete(ok ? 'Phản hồi đã được gửi thành công.' : 'Đã lưu cục bộ. Gửi trực tuyến thất bại — dữ liệu vẫn an toàn.', ok);
      });
    } else {
      showComplete('Cảm ơn bạn! Phản hồi đã được ghi nhận.', true);
    }
  }

  function launchBalloons() {
    const container = document.getElementById('se-balloons');
    if (!container) return;
    container.innerHTML = '';
    container.style.display = 'block';
    const colors = ['#e4002b','#ffcc00','#00a651','#0072ce','#ff6b35','#9b59b6','#1abc9c','#e91e63','#ff9800','#00bcd4'];
    for (let i = 0; i < 22; i++) {
      const b = document.createElement('div');
      b.className = 'se-balloon';
      const size = 36 + Math.random() * 44;
      const left = 3 + Math.random() * 94;
      const dur = 3.5 + Math.random() * 3;
      const delay = Math.random() * 2.5;
      const color = colors[Math.floor(Math.random() * colors.length)];
      b.style.cssText = `width:${size}px;height:${size * 1.25}px;left:${left}%;background:radial-gradient(circle at 35% 35%,rgba(255,255,255,0.45),${color} 60%);animation-duration:${dur}s;animation-delay:${delay}s;`;
      container.appendChild(b);
    }
    setTimeout(() => { container.style.display = 'none'; }, 7000);
  }

  function showComplete(msg, success) {
    const form = document.getElementById('se-form');
    const progress = document.getElementById('se-progress-wrap');
    const thankyou = document.getElementById('se-thankyou');
    if (form) form.style.display = 'none';
    if (progress) progress.style.display = 'none';
    const metaRow = document.querySelector('.se-meta-row');
    if (metaRow) metaRow.style.display = 'none';
    if (thankyou) thankyou.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(msg, success ? '#27ae60' : '#f39c12');
    if (success) launchBalloons();
  }

  // ─────────────────────────────────────────────
  // PUBLIC API — window.SurveyEngine
  // ─────────────────────────────────────────────
  window.SurveyEngine = {

    reset: function () {
      const form = document.getElementById('se-form');
      const progress = document.getElementById('se-progress-wrap');
      const thankyou = document.getElementById('se-thankyou');
      const metaRow = document.querySelector('.se-meta-row');
      if (form) { form.reset(); form.style.display = 'block'; }
      if (progress) progress.style.display = 'flex';
      if (metaRow) metaRow.style.display = 'flex';
      if (thankyou) thankyou.style.display = 'none';
      const dateEl = document.getElementById('se_date');
      if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];
      // Reset "other" fields
      document.querySelectorAll('.se-other-input').forEach(w => { w.style.display = 'none'; });
      updateProgress();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    toggleAdmin: function () {
      const panel = document.getElementById('se-admin-panel');
      const overlay = document.getElementById('se-admin-overlay');
      if (panel && panel.classList.contains('active')) {
        panel.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        return;
      }
      if (_adminAuthenticated) {
        if (panel) panel.classList.add('active');
        if (overlay) overlay.classList.add('active');
        return;
      }
      const pwd = prompt('Nhập mật khẩu quản trị:');
      if (!pwd) return;
      const adminHash = (document.querySelector('meta[name="admin-password-hash"]') || {}).content || '';
      crypto.subtle.digest('SHA-256', new TextEncoder().encode(pwd)).then(buf => {
        const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
        if (hash === adminHash) {
          _adminAuthenticated = true;
          sessionStorage.setItem(storageKey('admin_auth'), 'true');
          if (panel) panel.classList.add('active');
          if (overlay) overlay.classList.add('active');
          showToast('Đăng nhập quản trị thành công!', '#27ae60');
        } else {
          showToast('Sai mật khẩu. Truy cập bị từ chối.', '#e74c3c');
        }
      });
    },

    closeAdmin: function () {
      const panel = document.getElementById('se-admin-panel');
      const overlay = document.getElementById('se-admin-overlay');
      if (panel) panel.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
    },

    addCustomQuestion: function () {
      const qText = (document.getElementById('se-admin-q') || {}).value || '';
      const type = (document.getElementById('se-admin-type') || {}).value || 'likert';
      const optsText = (document.getElementById('se-admin-opts') || {}).value || '';
      if (!qText.trim()) { showToast('Vui lòng nhập nội dung câu hỏi.', '#e74c3c'); return; }
      _customQuestions.push({
        id: 'custom_' + Date.now(),
        text: qText.trim(),
        type,
        options: type === 'radio' ? optsText.split('\n').filter(o => o.trim()) : []
      });
      localStorage.setItem(storageKey('custom_questions'), JSON.stringify(_customQuestions));
      if (document.getElementById('se-admin-q')) document.getElementById('se-admin-q').value = '';
      if (document.getElementById('se-admin-opts')) document.getElementById('se-admin-opts').value = '';
      renderCustomQuestions();
      showToast('Đã thêm câu hỏi mới!', '#27ae60');
    },

    removeCustomQuestion: function (id) {
      _customQuestions = _customQuestions.filter(q => q.id !== id);
      localStorage.setItem(storageKey('custom_questions'), JSON.stringify(_customQuestions));
      renderCustomQuestions();
      showToast('Đã xóa câu hỏi.', '#f39c12');
    },

    saveGoogleConfig: function () {
      const urlEl = document.getElementById('se-gs-url');
      const url = urlEl ? urlEl.value.trim() : '';
      if (!url) { showToast('Vui lòng nhập URL.', '#e74c3c'); return; }
      if (!url.startsWith('https://script.google.com/')) {
        showToast('URL không hợp lệ. Phải bắt đầu bằng https://script.google.com/', '#e74c3c');
        return;
      }
      _googleScriptUrl = url;
      localStorage.setItem(storageKey('google_url'), url);
      updateOnlineStatus();
      showToast('Đã kết nối Google Sheets!', '#27ae60');
    },

    disconnectGoogle: function () {
      _googleScriptUrl = '';
      localStorage.removeItem(storageKey('google_url'));
      const urlEl = document.getElementById('se-gs-url');
      if (urlEl) urlEl.value = '';
      updateOnlineStatus();
      showToast('Đã ngắt kết nối. Dữ liệu sẽ chỉ lưu cục bộ.', '#f39c12');
    },

    exportCSV: function () {
      if (!_responses.length) { showToast('Chưa có dữ liệu để xuất.', '#f39c12'); return; }
      const allKeys = new Set();
      _responses.forEach(r => Object.keys(r).forEach(k => allKeys.add(k)));
      const keys = Array.from(allKeys);
      let csv = '\uFEFF' + keys.join(',') + '\n';
      _responses.forEach(r => {
        csv += keys.map(k => '"' + (r[k] || '').toString().replace(/"/g, '""') + '"').join(',') + '\n';
      });
      _download(csv, `${cfg.storageKey || 'survey'}_responses_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8');
    },

    exportJSON: function () {
      if (!_responses.length) { showToast('Chưa có dữ liệu để xuất.', '#f39c12'); return; }
      _download(JSON.stringify(_responses, null, 2), `${cfg.storageKey || 'survey'}_responses_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
    },

    clearData: function () {
      if (!confirm('Bạn có chắc chắn muốn xóa TẤT CẢ dữ liệu phản hồi? Hành động này không thể hoàn tác.')) return;
      _responses = [];
      localStorage.removeItem(storageKey('responses'));
      updateResponseCount();
      showToast('Đã xóa tất cả dữ liệu phản hồi.', '#e74c3c');
    },

    showAppsScript: function () {
      const headers = computeHeaders();
      const spreadsheetId = cfg.spreadsheetId || 'YOUR_SPREADSHEET_ID';
      const code = `// Dán mã này vào Google Apps Script (Extensions → Apps Script)\n// File: Code.gs\n\nvar SPREADSHEET_ID = '${spreadsheetId}';\nvar HEADERS = ${JSON.stringify(headers, null, 2)};\n\nfunction doPost(e) {\n  var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();\n  var data = JSON.parse(e.parameter.payload);\n  if (sheet.getLastRow() === 0) {\n    sheet.appendRow(HEADERS);\n    sheet.getRange(1,1,1,HEADERS.length).setFontWeight('bold').setBackground('#000054').setFontColor('#FFFFFF');\n    sheet.setFrozenRows(1);\n  }\n  var existingHeaders = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];\n  var row = existingHeaders.map(function(h){return data[h]||'';});\n  Object.keys(data).forEach(function(key){\n    if(existingHeaders.indexOf(key)===-1){\n      existingHeaders.push(key);\n      sheet.getRange(1,existingHeaders.length).setValue(key);\n      row.push(data[key]||'');\n    }\n  });\n  sheet.appendRow(row);\n  return ContentService.createTextOutput(JSON.stringify({status:'ok'})).setMimeType(ContentService.MimeType.JSON);\n}\n\nfunction doGet(){return ContentService.createTextOutput(JSON.stringify({status:'ready'})).setMimeType(ContentService.MimeType.JSON);}`;
      const win = window.open('', '_blank', 'width=700,height=600');
      win.document.write(`<html><head><title>Apps Script</title><style>body{font-family:monospace;background:#1e1e2e;color:#cdd6f4;padding:20px;margin:0}pre{white-space:pre-wrap;font-size:13px;line-height:1.6}h2{color:#89b4fa;font-family:sans-serif;font-size:16px}button{background:#89b4fa;color:#1e1e2e;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;font-weight:bold}</style></head><body><h2>Google Apps Script — Copy mã này</h2><button onclick="navigator.clipboard.writeText(document.getElementById('c').textContent).then(()=>this.textContent='✓ Đã copy!')">&#128203; Copy mã</button><pre id="c">${code.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></body></html>`);
      win.document.close();
    }
  };

  // ─────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────
  function renderCustomQuestions() {
    const container = document.getElementById('se-custom-container');
    const listEl = document.getElementById('se-custom-list');
    const section = document.getElementById('se-custom-section');
    if (!container) return;

    container.innerHTML = '';
    if (listEl) listEl.innerHTML = '';

    if (!_customQuestions.length) {
      if (section) section.classList.remove('has-questions');
      if (listEl) listEl.innerHTML = '<em>Chưa có câu hỏi bổ sung nào.</em>';
      return;
    }

    if (section) section.classList.add('has-questions');

    _customQuestions.forEach((q, idx) => {
      const block = document.createElement('div');
      block.className = 'se-qblock';
      let inputHtml = '';
      const safeText = esc(q.text);

      if (q.type === 'likert') {
        const opts = [1,2,3,4,5].map(i =>
          `<label><span>${i}</span><input type="radio" name="${q.id}" value="${i}" ${i===1?'required':''}></label>`
        ).join('');
        inputHtml = `<div class="se-likert"><span class="lk-end left">Hoàn toàn<br>không đồng ý</span><div class="se-likert-opts">${opts}</div><span class="lk-end right">Hoàn toàn<br>đồng ý</span></div>`;
      } else if (q.type === 'radio') {
        const opts = q.options.map(o => `<label><input type="radio" name="${q.id}" value="${esc(o)}" required> ${esc(o)}</label>`).join('');
        inputHtml = `<div class="se-options">${opts}</div>`;
      } else {
        inputHtml = `<div class="se-text-input"><input type="text" name="${q.id}" placeholder="Nhập câu trả lời..." required></div>`;
      }

      block.innerHTML = `<div class="se-qlabel"><span class="se-qnum">${idx+1}</span><span>${safeText}</span></div>${inputHtml}`;
      container.appendChild(block);

      if (listEl) {
        const typeLabels = { likert: 'Likert', radio: 'Trắc nghiệm', text: 'Tự do' };
        const item = document.createElement('div');
        item.style.cssText = 'padding:8px 0;border-bottom:1px solid #f0f2f5;display:flex;align-items:center;justify-content:space-between;';
        item.innerHTML = `<div><strong>${idx+1}.</strong> ${safeText} <em style="color:var(--primary)">(${typeLabels[q.type]})</em></div>
          <button class="se-remove-btn" onclick="SurveyEngine.removeCustomQuestion('${q.id}')" title="Xóa">&#10005;</button>`;
        listEl.appendChild(item);
      }
    });

    updateProgress();
  }

  function sendToGoogleSheets(data) {
    if (!_googleScriptUrl) return Promise.resolve(false);
    const body = new URLSearchParams();
    body.append('payload', JSON.stringify(data));
    return fetch(_googleScriptUrl, { method: 'POST', body })
      .then(r => r.ok ? r.json().then(() => true).catch(() => true) : true)
      .catch(() => false);
  }

  function updateOnlineStatus() {
    const badge = document.getElementById('se-online-badge');
    const text = document.getElementById('se-status-text');
    if (!badge || !text) return;
    if (_googleScriptUrl) {
      badge.className = 'se-status-badge online';
      text.textContent = 'Trực tuyến — Google Sheets';
    } else {
      badge.className = 'se-status-badge offline';
      text.textContent = 'Ngoại tuyến — Chỉ lưu cục bộ';
    }
  }

  function updateResponseCount() {
    const el = document.getElementById('se-response-count');
    if (el) el.textContent = _responses.length;
  }

  function showToast(msg, color) {
    const toast = document.getElementById('se-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.background = color || '#27ae60';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  function _download(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  // ── Start ──
  init();

})(window.SURVEY_CONFIG);
