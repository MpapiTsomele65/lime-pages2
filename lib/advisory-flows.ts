export interface FlowOption {
  label: string;
  next: string;
}

export interface FlowNode {
  message: string;
  options: FlowOption[];
}

export type Flows = Record<string, FlowNode>;

export const FLOWS: Flows = {

  start: {
    message: `👋 Hey there! Welcome to <strong>Lime Advisors</strong> — your free guide to understanding your financial rights as a South African consumer.<br><br>At Lime Pages, we believe that <strong>building wealth starts with knowing your rights</strong>. Whether you're an entrepreneur, a professional, or just trying to make ends meet — this tool is here to help you stand your ground.<br><br>What can I help you with?`,
    options: [
      { label: "🛡️ Know Your Rights — Credit, Consumer & Insurance", next: "start_rights" },
      { label: "📈 Investing & Financial Planning", next: "start_wealth" },
      { label: "🏛️ Pension & Retirement (Two-Pot)", next: "pension_main" },
      { label: "💼 Business Funding & Growth (SMMEs)", next: "smme_main" },
      { label: "❓ Not sure — help me figure it out", next: "not_sure" },
    ],
  },

  start_rights: {
    message: `Great — let's make sure you know where you stand. Which area do you need help with?`,
    options: [
      { label: "🏦 Credit, Loans & Debt (NCA)", next: "nca_main" },
      { label: "📊 Financial Advice, Insurance & Investments (FAIS)", next: "fais_main" },
      { label: "🛒 Consumer Rights — Goods & Services (CPA)", next: "cpa_main" },
      { label: "↩️ Back to main menu", next: "start" },
    ],
  },

  start_wealth: {
    message: `Let's build that wealth. Where would you like to start?`,
    options: [
      { label: "���� Investing — Build & Grow Your Wealth", next: "invest_main" },
      { label: "🧩 Holistic Financial Planning (CFP)", next: "cfp_main" },
      { label: "💡 Warren Ingram's Financial Wisdom", next: "ingram_main" },
      { label: "↩️ Back to main menu", next: "start" },
    ],
  },

  not_sure: {
    message: `No problem — let's figure it out together. ☕<br><br>Quick question: <strong>Is your issue about borrowing money or being in debt?</strong> (e.g. loans, credit cards, store accounts, home loans, being harassed by collectors)`,
    options: [
      { label: "✅ Yes, it's about credit or debt", next: "nca_main" },
      { label: "📋 No — it's about advice or a financial product I bought", next: "fais_main" },
      { label: "🔄 It involves both", next: "both" },
    ],
  },

  both: {
    message: `Got it — sometimes both laws are relevant. Let's start with whichever feels most urgent right now.`,
    options: [
      { label: "💸 The credit / debt side (NCA)", next: "nca_main" },
      { label: "📋 The financial advice / product side (FAIS)", next: "fais_main" },
    ],
  },

  nca_main: {
    message: `The <strong>National Credit Act (NCA)</strong> is one of the strongest consumer protection laws in South Africa. It covers everything from loans and credit cards to store accounts and home loans.<br><br>We'll walk you through both <strong>what the Act says</strong> (your rights) and <strong>what the Regulations prescribe</strong> (the specific rules and caps that apply).<br><br>What's happening in your situation?`,
    options: [
      { label: "🚫 My credit application was refused", next: "nca_refused" },
      { label: "😰 I'm struggling to repay my debts", next: "nca_overindebted" },
      { label: "📞 A debt collector is harassing me", next: "nca_harassment" },
      { label: "💰 I'm being overcharged on interest or fees", next: "nca_overcharged" },
      { label: "📄 I want to check or fix my credit record", next: "nca_credit_record" },
      { label: "⚠️ I was given credit I couldn't afford", next: "nca_reckless" },
      { label: "↩️ Back to main menu", next: "start" },
    ],
  },

  nca_refused: {
    message: `<strong>Your right to know why (Section 62, NCA)</strong><br><br>Being told "no" without a reason is not okay. The law is clear — if you ask, they must tell you why.<div class="info-card"><h4>📋 What the Act says</h4><ul><li>A credit provider must give you <strong>written reasons</strong> for refusing your application if you ask (s.62)</li><li>You have the right to information in a <strong>language you understand</strong> (s.63) and in <strong>plain language</strong> (s.64)</li><li>Refusing you based on <strong>race, gender, or other discrimination</strong> is illegal (s.61)</li></ul></div><div class="info-card"><h4>📖 What the Regulations say</h4><ul><li>The credit provider must conduct a proper <strong>affordability assessment</strong> (Reg 23A) — if they refused you without doing this, they didn't follow the prescribed process</li><li>The <strong>prescribed form</strong> for the assessment must consider your gross income, existing financial obligations, and necessary expenses (Reg 23A(5)-(7))</li><li>They cannot use an <strong>unreasonably low income threshold</strong> as an automatic disqualifier — the assessment must be individualised</li></ul></div><div class="info-card"><h4>✅ What to do — step by step</h4><ul><li><strong>Step 1:</strong> Ask the credit provider <em>in writing</em> for the specific reasons</li><li><strong>Step 2:</strong> Ask whether a proper affordability assessment was conducted per Regulation 23A</li><li><strong>Step 3:</strong> Request your free annual credit report to check for issues on your record</li><li><strong>Step 4:</strong> If you were discriminated against or no proper assessment was done, report it to the <strong>NCR</strong></li></ul></div><div class="contact-block"><strong>📞 National Credit Regulator (NCR)</strong>0860 627 627 | www.ncr.org.za</div>`,
    options: [
      { label: "📄 I also want to check my credit record", next: "nca_credit_record" },
      { label: "🏠 Back to Credit & Debt menu", next: "nca_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  nca_overindebted: {
    message: `<strong>Your right to Debt Review (Section 86, NCA)</strong><br><br>If you genuinely cannot afford to pay all your debts, <strong>debt review is a legal lifeline</strong> — not a punishment.<div class="info-card"><h4>📋 How debt review works (the Act)</h4><ul><li><strong>Step 1:</strong> Apply to a registered <strong>Debt Counsellor</strong> (NCR-registered)</li><li><strong>Step 2:</strong> The counsellor notifies all credit providers — they <strong>cannot take legal action</strong> while you're under review (s.88)</li><li><strong>Step 3:</strong> A reduced, affordable payment plan is proposed</li><li><strong>Step 4:</strong> Agreement becomes a <strong>court order</strong> — legally binding on all parties</li><li><strong>Step 5:</strong> Once all debts are paid, you receive a <strong>clearance certificate</strong> and your record is cleared (s.71)</li></ul></div><div class="info-card"><h4>📖 What the Regulations say</h4><ul><li>The debt counsellor must follow the <strong>prescribed process and timelines</strong> (Reg 24) — including sending a Form 17.1 to all credit providers within 5 business days</li><li><strong>Debt counselling fees are capped</strong> by regulation — a counsellor cannot charge you more than the prescribed maximum (Reg 24(8)): application fee, rejection fee, and aftercare fees are all regulated</li><li>Payment distribution to credit providers must follow the <strong>pro-rata distribution plan</strong> (Reg 25) — no single creditor can claim priority unless it's a secured debt</li><li>The counsellor must send you a <strong>Form 17.W (withdrawal notice)</strong> if you want to exit debt review — you have the right to withdraw before a court order is granted (Reg 24(10))</li></ul></div><div class="info-card"><h4>⚠️ Important to know</h4><ul><li>Debt review is <strong>not blacklisting</strong> — it is a protection mechanism for you</li><li>You cannot take on new credit while under debt review</li><li>Only use a <strong>registered debt counsellor</strong> — verify on the NCR website</li><li>Be wary of scammers claiming to "clear" your record overnight</li></ul></div><div class="contact-block"><strong>📞 Find a registered debt counsellor:</strong>NCR — 0860 627 627 | www.ncr.org.za</div>`,
    options: [
      { label: "📞 A collector is also harassing me", next: "nca_harassment" },
      { label: "🏠 Back to Credit & Debt menu", next: "nca_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  nca_harassment: {
    message: `<strong>Protection from debt collector harassment (Section 133, NCA)</strong><br><br>Debt collectors in South Africa operate within <strong>strict legal limits</strong>. Many of the tactics used every day are flat-out illegal.<div class="info-card"><h4>🚫 What collectors are PROHIBITED from doing (the Act)</h4><ul><li>Contacting you at <strong>unreasonable hours</strong></li><li><strong>Threatening arrest or criminal charges</strong> — civil debt is NOT a criminal matter</li><li>Using <strong>abusive, threatening, or humiliating language</strong></li><li><strong>Misrepresenting</strong> the amount you owe</li><li>Contacting your <strong>employer, family, or neighbours</strong> to embarrass you</li><li>Collecting a <strong>time-expired (prescribed) debt</strong> without disclosing it's prescribed</li></ul></div><div class="info-card"><h4>📖 What the Regulations say</h4><ul><li>Debt collectors must be <strong>registered with the Council for Debt Collectors</strong> — you can verify their registration and they must provide their registration number on request (Reg 28)</li><li>Collection charges are <strong>strictly regulated</strong> — a collector cannot add arbitrary fees. Only <strong>prescribed collection costs</strong> may be passed on to you (Reg 46)</li><li>Any <strong>letter of demand</strong> sent must comply with prescribed requirements — it must state the correct amount owed and the creditor's details (Reg 29)</li><li>If a debt is <strong>prescribed</strong> (older than 3 years with no acknowledgement), the collector must inform you — and you have the right to raise prescription as a defence</li></ul></div><div class="info-card"><h4>✅ What to do right now</h4><ul><li><strong>Step 1:</strong> <em>Document everything</em> — screenshots, call logs, WhatsApp messages</li><li><strong>Step 2:</strong> Ask for the collector's name, employer name, and registration number</li><li><strong>Step 3:</strong> Lodge a complaint with the <strong>NCR</strong> and the <strong>Council for Debt Collectors</strong></li><li><strong>Step 4:</strong> If harassment continues, approach the <strong>National Consumer Tribunal (NCT)</strong></li></ul></div><div class="contact-block"><strong>📞 Report harassment to:</strong>NCR — 0860 627 627 | www.ncr.org.za<br>Council for Debt Collectors — 012 804 9808 | www.cfdc.org.za<br>NCT — www.thenct.org.za</div>`,
    options: [
      { label: "😰 I'm also struggling to repay my debts", next: "nca_overindebted" },
      { label: "🏠 Back to Credit & Debt menu", next: "nca_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  nca_overcharged: {
    message: `<strong>Your right to fair costs (Sections 100–105, NCA)</strong><br><br>The NCA sets a <strong>strict and exhaustive list</strong> of what a credit provider may charge you — and the Regulations set the exact maximum amounts.<div class="info-card"><h4>📋 The ONLY permitted charges (the Act)</h4><ul><li>Principal debt (the amount you borrowed)</li><li><strong>Initiation fee</strong> — once-off, capped by regulation</li><li><strong>Service fee</strong> — monthly admin fee, capped</li><li><strong>Interest</strong> — cannot exceed the Minister's maximum rate</li><li><strong>Credit insurance</strong> — optional, capped</li><li><strong>Default administration charge</strong> — only if you miss a payment</li><li><strong>Collection costs</strong> — only when enforcement action is taken</li></ul></div><div class="info-card"><h4>📖 What the Regulations prescribe (exact caps)</h4><ul><li><strong>Maximum interest rates</strong> (Reg 42): varies by credit type — e.g. mortgage agreements: repo rate + 12% per year; unsecured credit: repo rate + 21% per year; short-term transactions: 5% per month</li><li><strong>Maximum initiation fee</strong> (Reg 43): the greater of R165 or 10% of the amount (up to R1,050) + 50% on amounts above R10,000 — capped at a total maximum that adjusts annually</li><li><strong>Maximum monthly service fee</strong> (Reg 44): capped at <strong>R69 per month</strong> (adjusted annually)</li><li><strong>Credit life insurance</strong>: cannot exceed <strong>R4.50 per R1,000</strong> of the outstanding balance per month</li><li>Any charge <strong>not on this list is unlawful</strong> — you do not have to pay it</li></ul></div><div class="info-card"><h4>✅ What to do</h4><ul><li><strong>Step 1:</strong> Request a full <em>statement of account</em> (s.108)</li><li><strong>Step 2:</strong> Check every line item against the permitted charges and regulated caps above</li><li><strong>Step 3:</strong> Challenge any unlawful or excessive charges in writing — cite the specific regulation</li><li><strong>Step 4:</strong> If unresolved — report to the <strong>NCR</strong></li></ul></div><div class="contact-block"><strong>📞 Report overcharging to:</strong>NCR — 0860 627 627 | www.ncr.org.za</div>`,
    options: [
      { label: "🏠 Back to Credit & Debt menu", next: "nca_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  nca_credit_record: {
    message: `<strong>Your credit record rights (Sections 71–72, NCA)</strong><br><br>Your credit record shapes your ability to borrow, rent, and sometimes even get a job.<div class="info-card"><h4>📋 Your rights (the Act)</h4><ul><li><strong>Free annual report:</strong> One free credit report per year from each bureau (s.72)</li><li><strong>Right to challenge:</strong> Dispute errors — the bureau must investigate</li><li><strong>Paid-up debts:</strong> Adverse information <strong>must be removed</strong> (s.71)</li><li><strong>Paid judgments:</strong> Removed within <strong>5 business days</strong> of proof of payment</li><li><strong>Prescribed debt:</strong> Old expired debts should not appear on your record</li></ul></div><div class="info-card"><h4>📖 What the Regulations say</h4><ul><li>Credit bureaus must remove <strong>adverse consumer credit information</strong> after the prescribed retention period — typically <strong>1 year</strong> for payment profile data once the account is paid up (Reg 17(1))</li><li><strong>Subjective classification data</strong> (like "slow payer") must be removed within <strong>1 year</strong> of the account being settled (Reg 17(1)(c))</li><li>A <strong>default listing</strong> must be removed within <strong>1 year</strong> after the debt is paid, or after <strong>2 years</strong> from the date of listing — whichever comes first</li><li>Credit bureaus must have a <strong>complaints resolution process</strong> and must resolve disputes within <strong>20 business days</strong> (Reg 19)</li><li>If a bureau fails to correct inaccurate information, you can escalate to the <strong>NCR</strong> — the bureau faces penalties for non-compliance</li></ul></div><div class="info-card"><h4>✅ What to do</h4><ul><li><strong>Step 1:</strong> Request your free annual report from TransUnion, Experian, Compuscan, or XDS</li><li><strong>Step 2:</strong> Review for errors, old paid debts, or accounts you don't recognise</li><li><strong>Step 3:</strong> Dispute incorrect entries with the credit bureau in writing — cite Reg 17 and the specific retention periods</li><li><strong>Step 4:</strong> If unresolved within 20 business days — escalate to the <strong>NCR</strong></li></ul></div><div class="contact-block"><strong>📞 NCR — 0860 627 627 | www.ncr.org.za</strong><br>Free annual report: www.mycreditcheck.co.za</div>`,
    options: [
      { label: "🏠 Back to Credit & Debt menu", next: "nca_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  nca_reckless: {
    message: `<strong>Protection against reckless lending (Sections 80–81, NCA)</strong><br><br>If a lender gave you credit <strong>without properly checking whether you could afford it</strong>, that is <em>reckless credit</em> — and it is illegal.<div class="info-card"><h4>📋 What counts as reckless credit? (the Act)</h4><ul><li>The credit provider <strong>did not assess your income and expenses</strong> before granting credit</li><li>They assessed it but gave you credit when you were <strong>already over-indebted</strong></li><li>You did not fully understand the <strong>risks, costs or obligations</strong></li></ul></div><div class="info-card"><h4>📖 What the Regulations require (Reg 23A)</h4><ul><li>Before granting ANY credit, the provider must conduct an <strong>affordability assessment</strong> using the prescribed steps — this is not optional (Reg 23A(3))</li><li>They must validate your <strong>gross income</strong> using payslips, bank statements, or tax returns (Reg 23A(5))</li><li>They must deduct your <strong>existing financial obligations</strong> — all current loan repayments, maintenance orders, and other debts (Reg 23A(6))</li><li>They must deduct your <strong>necessary living expenses</strong> — using either your declared expenses or the NCR's minimum expense norms, whichever is higher (Reg 23A(7))</li><li>Only the <strong>remaining discretionary income</strong> can be used to determine whether you can afford the new repayment</li><li>If the lender skipped any of these steps, you have strong grounds to argue <strong>reckless lending</strong></li></ul></div><div class="info-card"><h4>✅ What can happen</h4><ul><li>A court can <strong>suspend the credit agreement</strong> and reduce your obligations (s.83)</li><li>In serious cases, the court may <strong>write off the debt entirely</strong></li><li>The credit provider can face <strong>fines and regulatory action</strong></li></ul></div><div class="info-card"><h4>✅ What to do</h4><ul><li><strong>Step 1:</strong> Gather your loan documents — was an affordability assessment completed per Reg 23A?</li><li><strong>Step 2:</strong> Request proof of the assessment from the credit provider — they are required to keep records</li><li><strong>Step 3:</strong> Contact the NCR or a registered debt counsellor</li><li><strong>Step 4:</strong> You can raise reckless lending as a <strong>defence</strong> in court</li></ul></div><div class="contact-block"><strong>📞 NCR — 0860 627 627 | www.ncr.org.za</strong></div>`,
    options: [
      { label: "😰 I'm also struggling to repay", next: "nca_overindebted" },
      { label: "🏠 Back to Credit & Debt menu", next: "nca_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  fais_main: {
    message: `The <strong>FAIS Act</strong> (Financial Advisory and Intermediary Services Act) protects you when you receive financial advice or buy financial products — investments, insurance, retirement annuities, and more.<br><br>We'll walk you through both <strong>what the Act says</strong> (your rights) and <strong>what the General Code of Conduct requires</strong> (the specific rules your adviser must follow).<br><br>What's going on in your situation?`,
    options: [
      { label: "📉 I received bad or unsuitable advice", next: "fais_bad_advice" },
      { label: "🔍 My adviser may not be licensed", next: "fais_unlicensed" },
      { label: "💸 I lost money due to my adviser's actions", next: "fais_lost_money" },
      { label: "🛡️ My insurance claim was unfairly rejected", next: "fais_insurance" },
      { label: "📝 I want to make a formal complaint", next: "fais_complaint" },
      { label: "↩️ Back to main menu", next: "start" },
    ],
  },

  fais_bad_advice: {
    message: `<strong>Your right to fair, suitable advice (Section 16, FAIS Act)</strong><br><br>An adviser who recommends a product that <strong>doesn't fit your needs</strong> is breaking the law.<div class="info-card"><h4>📋 What your adviser MUST do (s.16)</h4><ul><li><strong>Ask about your financial situation</strong>, experience, and goals <em>before</em> advising</li><li>Act <strong>honestly and fairly</strong> with due skill, care, and diligence</li><li><strong>Disclose all material information</strong>, including their own interest</li><li>Treat you fairly when there is a <strong>conflict of interest</strong></li></ul></div><div class="info-card"><h4>📖 What the General Code of Conduct requires</h4><ul><li>Your adviser must conduct a thorough <strong>needs analysis</strong> before making any recommendation — this is not optional (GCC s.8)</li><li>They must provide you with a <strong>written Record of Advice</strong> documenting what was recommended and why (GCC s.9)</li><li>All <strong>fees, commissions, and charges</strong> must be disclosed upfront — including any commission they earn from the product provider (GCC s.3(1)(d))</li><li>The product must be <strong>appropriate</strong> to your risk profile, financial situation, and objectives — not just profitable for the adviser (GCC s.8(1)(c))</li><li>If they failed to do ANY of these, you have strong grounds for a complaint</li></ul></div><div class="info-card"><h4>✅ What to do</h4><ul><li><strong>Step 1:</strong> Gather all documents — advice given, product recommended, written communication</li><li><strong>Step 2:</strong> Complain directly to the FSP — they must have a complaints process</li><li><strong>Step 3:</strong> If unresolved, take it to the <strong>FAIS Ombud</strong> — completely free</li><li><strong>Step 4:</strong> You have <strong>3 years</strong> from when you became aware to complain</li></ul></div><div class="contact-block"><strong>📞 FAIS Ombud — 0860 324 766</strong><br>www.faisombud.co.za | info@faisombud.co.za</div>`,
    options: [
      { label: "📝 I want to make a formal complaint", next: "fais_complaint" },
      { label: "🏠 Back to Financial Advice menu", next: "fais_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  fais_unlicensed: {
    message: `<strong>Your right to a licensed adviser (Section 7, FAIS Act)</strong><br><br><strong>No one may give financial advice or sell financial products without a licence.</strong> This is a criminal offence.<div class="info-card"><h4>📋 Why this matters</h4><ul><li>Any transaction with an unlicensed adviser may be <strong>unenforceable</strong> (s.7(2))</li><li>Unlicensed operators are often behind <strong>investment scams and pyramid schemes</strong></li><li>You have the right to <strong>verify anyone's licence</strong> before investing</li></ul></div><div class="info-card"><h4>📖 What the Regulations require (Fit & Proper)</h4><ul><li>All FSPs and their representatives must meet <strong>Fit and Proper requirements</strong> — including honesty, integrity, competence, and financial soundness (Board Notice 194 of 2017)</li><li>Representatives must hold the relevant <strong>recognised qualifications</strong> and complete annual <strong>Continuing Professional Development (CPD)</strong> hours</li><li>The FSCA maintains a public <strong>FSP Register</strong> — if they're not on it, they cannot legally advise you</li><li>An unlicensed person providing advice commits a <strong>criminal offence</strong> punishable by a fine or up to 10 years imprisonment (s.7(2))</li></ul></div><div class="info-card"><h4>✅ How to check</h4><ul><li><strong>Step 1:</strong> Ask for their <strong>FSP licence number</strong></li><li><strong>Step 2:</strong> Verify on <strong>www.fsca.co.za</strong> → FSP Register</li><li><strong>Step 3:</strong> If NOT registered — <strong>report to the FSCA</strong></li><li><strong>Step 4:</strong> If fraud occurred — also report to <strong>SAPS</strong></li></ul></div><div class="contact-block"><strong>📞 FSCA: www.fsca.co.za</strong><br>FAIS Ombud — 0860 324 766 | www.faisombud.co.za</div>`,
    options: [
      { label: "💸 I also lost money", next: "fais_lost_money" },
      { label: "🏠 Back to Financial Advice menu", next: "fais_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  fais_lost_money: {
    message: `<strong>Your right to compensation (Section 28, FAIS Act)</strong><br><br>If you suffered <strong>financial loss because of your adviser's misconduct</strong>, you can claim compensation — and the Ombud's determination carries the same weight as a court judgment.<div class="info-card"><h4>📋 What the Ombud can do</h4><ul><li>Award you <strong>financial compensation</strong></li><li>Direct the FSP to <strong>take corrective action</strong></li><li>Make any order a <strong>court could make</strong></li><li>The determination is <strong>enforceable by the Sheriff</strong></li></ul></div><div class="info-card"><h4>📖 What the Regulations say (FAIS Ombud Rules)</h4><ul><li>The Ombud can award compensation up to <strong>R800,000</strong> — for amounts above this, you may need to approach the Financial Services Tribunal or courts</li><li>The FSP must have <strong>Professional Indemnity (PI) insurance</strong> to cover claims — this is mandatory under the regulations (BN 123 of 2009)</li><li>If the FSP has closed down, the <strong>PI insurer may still be liable</strong> — always ask for details of their PI cover</li><li>The determination is a <strong>final order</strong> equivalent to a civil court judgment and is enforceable by the Sheriff of the Court</li></ul></div><div class="info-card"><h4>⏰ Time limit — CRITICAL</h4><ul><li>Complain within <strong>3 years</strong> of becoming aware of the loss</li><li>Once submitted, the prescription clock <strong>pauses</strong></li></ul></div><div class="info-card"><h4>✅ What to do</h4><ul><li><strong>Step 1:</strong> Gather evidence — contracts, emails, statements</li><li><strong>Step 2:</strong> Calculate your actual loss clearly</li><li><strong>Step 3:</strong> First complain to the FSP directly (give 6 weeks)</li><li><strong>Step 4:</strong> Submit to the <strong>FAIS Ombud</strong> — it is free</li></ul></div><div class="contact-block"><strong>📞 FAIS Ombud — 0860 324 766</strong><br>www.faisombud.co.za</div>`,
    options: [
      { label: "📝 Make a formal complaint now", next: "fais_complaint" },
      { label: "🏠 Back to Financial Advice menu", next: "fais_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  fais_insurance: {
    message: `<strong>Insurance claim disputes</strong><br><br>An unfair claim rejection is one of the most common financial complaints in South Africa.<div class="info-card"><h4>📋 Which Ombud handles your complaint?</h4><ul><li><strong>Short-term insurance</strong> (car, home, business): 0860 726 890</li><li><strong>Long-term insurance</strong> (life, disability, funeral): 0860 103 236</li><li><strong>Bad advice from a broker:</strong> FAIS Ombud — 0860 324 766</li><li><strong>Medical scheme disputes:</strong> Council for Medical Schemes — 0861 123 267</li></ul></div><div class="info-card"><h4>📖 What the Regulations require (Policyholder Protection Rules)</h4><ul><li>Insurers must handle claims <strong>fairly and promptly</strong> — the Policyholder Protection Rules (PPR) require insurers to settle valid claims within a reasonable time</li><li>If they reject your claim, they must give you <strong>clear written reasons</strong> and inform you of your right to escalate to the relevant Ombud</li><li>Your broker must have disclosed all <strong>material terms, conditions, and exclusions</strong> before you signed — if they didn't, the broker may be liable under FAIS (GCC s.7)</li><li>Waiting periods, exclusions, and <strong>policy limitations must be clearly explained</strong> in plain language — hidden terms may be unenforceable</li></ul></div><div class="info-card"><h4>✅ What to do</h4><ul><li><strong>Step 1:</strong> Request <em>written reasons</em> for the rejection</li><li><strong>Step 2:</strong> Lodge an internal complaint first</li><li><strong>Step 3:</strong> If unresolved within 6 weeks, approach the relevant Ombud</li><li>All services are <strong>free to consumers</strong></li></ul></div>`,
    options: [
      { label: "📝 Make a FAIS complaint about my broker", next: "fais_complaint" },
      { label: "🏠 Back to Financial Advice menu", next: "fais_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  fais_complaint: {
    message: `<strong>How to complain to the FAIS Ombud</strong><br><br>The FAIS Ombud is <strong>independent and free</strong>. You don't need a lawyer.<div class="info-card"><h4>📋 The complaint process</h4><ul><li><strong>Step 1:</strong> Complain to the FSP first (allow ~6 weeks)</li><li><strong>Step 2:</strong> If unresolved — go to <strong>www.faisombud.co.za</strong></li><li><strong>Step 3:</strong> Include: your name, FSP's name, description, and all documents</li><li><strong>Step 4:</strong> The Ombud tries <strong>conciliated settlement</strong> first</li><li><strong>Step 5:</strong> If no settlement — a <strong>final, binding determination</strong></li></ul></div><div class="info-card"><h4>📖 What the Regulations prescribe (Ombud Rules)</h4><ul><li>The FSP itself must have an <strong>internal complaints resolution process</strong> and must respond within <strong>6 weeks</strong> — this is required under the General Code of Conduct (GCC s.10)</li><li>If the FSP fails to resolve within 6 weeks, you can escalate directly to the Ombud — you do <strong>not need a lawyer</strong></li><li>The Ombud first attempts <strong>conciliation</strong> — if that fails, a formal investigation leads to a <strong>binding determination</strong></li><li>Either party may appeal a determination to the <strong>Financial Services Tribunal</strong> within 6 weeks</li></ul></div><div class="info-card"><h4>⚠️ Key reminders</h4><ul><li>Complain within <strong>3 years</strong></li><li>The service is <strong>100% free</strong></li><li>A determination has the force of a <strong>court judgment</strong></li></ul></div><div class="contact-block"><strong>📞 FAIS Ombud — 0860 324 766</strong><br>www.faisombud.co.za | info@faisombud.co.za</div>`,
    options: [
      { label: "🏠 Back to Financial Advice menu", next: "fais_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  pension_main: {
    message: `The <strong>Pension Funds Act</strong> and the <strong>Two-Pot Retirement System</strong> (effective 1 September 2024) give South Africans new rights around their retirement savings.<br><br>We'll cover both <strong>what the Act says</strong> and <strong>what the Regulations and Revenue Laws prescribe</strong>.<br><br>What do you need help with?`,
    options: [
      { label: "🪣 The Two-Pot system — how does it work?", next: "two_pot_explainer" },
      { label: "💰 Can I withdraw from my savings pot?", next: "two_pot_access" },
      { label: "💸 What tax will I pay on a withdrawal?", next: "two_pot_tax" },
      { label: "⚠️ I think I'm being scammed or misled", next: "two_pot_scams" },
      { label: "🔧 What happens to my pension if I resign?", next: "pension_resignation" },
      { label: "📝 How do I complain about my pension fund?", next: "pension_complaint" },
      { label: "↩️ Back to main menu", next: "start" },
    ],
  },

  two_pot_explainer: {
    message: `<strong>The Two-Pot Retirement System — explained simply</strong><br><br>From <strong>1 September 2024</strong>, retirement savings are split into <strong>three components</strong>:<div class="info-card"><h4>🪣 1. Savings Component — "The Access Pot"</h4><ul><li><strong>One-third (1/3)</strong> of contributions from 1 September 2024</li><li>Once-off <strong>seed capital</strong>: 10% of pre-September 2024 savings, capped at <strong>R30,000</strong></li><li>Withdraw <strong>once per tax year</strong> (minimum R2,000)</li><li>Taxed at your <strong>marginal income tax rate</strong></li></ul></div><div class="info-card"><h4>🔒 2. Retirement Component — "The Locked Pot"</h4><ul><li><strong>Two-thirds (2/3)</strong> of contributions from 1 September 2024</li><li><strong>Cannot be accessed before retirement</strong> — not even on resignation</li><li>Must be used to buy an annuity at retirement</li></ul></div><div class="info-card"><h4>📁 3. Vested Component — "The Old Rules Pot"</h4><ul><li>All savings accumulated <strong>before 1 September 2024</strong></li><li>Governed by <strong>old rules</strong> — accessible on resignation, retrenchment, retirement, death, or disability</li></ul></div><div class="info-card"><h4>📖 What the Regulations prescribe</h4><ul><li>The Two-Pot system was enacted through the <strong>Revenue Laws Amendment Act, 2023</strong> (Act 19 of 2023) and amendments to the <strong>Pension Funds Act</strong> and <strong>Income Tax Act</strong></li><li>Fund rules must be updated to comply — your fund's <strong>registered rules</strong> with the FSCA govern the specific implementation details</li><li>The <strong>seed capital calculation</strong> is prescribed: exactly 10% of the vested value as at 31 August 2024, capped at R30,000 — funds must apply this consistently</li><li>Retirement funds had until <strong>1 September 2024</strong> to amend their rules — funds that failed to comply face FSCA enforcement action</li></ul></div>`,
    options: [
      { label: "💰 How do I withdraw from my savings pot?", next: "two_pot_access" },
      { label: "💸 What tax will I pay?", next: "two_pot_tax" },
      { label: "🏠 Back to Pension menu", next: "pension_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  two_pot_access: {
    message: `<strong>How to withdraw from your Savings Component</strong><div class="info-card"><h4>📋 The rules</h4><ul><li>Withdraw <strong>once per tax year</strong> (1 March to 28/29 February)</li><li>Minimum withdrawal: <strong>R2,000</strong></li><li>Maximum: full available balance in your Savings Component</li><li>No motivation required</li></ul></div><div class="info-card"><h4>✅ Step-by-step</h4><ul><li><strong>Step 1:</strong> Contact your pension fund administrator (or HR)</li><li><strong>Step 2:</strong> Request a savings withdrawal — fund requests a <strong>tax directive from SARS</strong></li><li><strong>Step 3:</strong> SARS issues the directive</li><li><strong>Step 4:</strong> Fund deducts tax and pays <strong>net amount</strong> to your bank</li><li>Processing: typically 5–21 working days</li></ul></div><div class="info-card"><h4>📖 What the Regulations prescribe</h4><ul><li>The fund must apply to SARS for a <strong>tax directive</strong> before making any payment — they cannot pay without this (Income Tax Act s.37D read with Reg)</li><li>SARS must issue the directive within <strong>21 business days</strong> of a complete application — delays beyond this can be escalated</li><li>Your fund's rules may prescribe the <strong>specific withdrawal form and process</strong> — always use your fund administrator's official channel</li><li>The fund may <strong>not charge you more than the prescribed fee</strong> for processing a savings withdrawal — excessive admin charges are prohibited</li></ul></div><div class="info-card"><h4>⚠️ Think carefully</h4><ul><li>Every rand withdrawn <strong>permanently reduces retirement savings</strong></li><li>The withdrawal is <strong>taxed as income</strong></li><li>Withdrawing regularly leaves you with very little at retirement</li></ul></div>`,
    options: [
      { label: "💸 What tax will I pay?", next: "two_pot_tax" },
      { label: "🏠 Back to Pension menu", next: "pension_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  two_pot_tax: {
    message: `<strong>Tax on your savings pot withdrawal</strong><br><br>Your savings pot withdrawal is taxed as income — just like salary.<div class="info-card"><h4>📋 How it works</h4><ul><li>SARS adds your withdrawal to your <strong>total annual income</strong></li><li>Taxed at your <strong>marginal income tax rate</strong></li><li>This is <strong>NOT</strong> the favourable retirement lump sum tax table</li></ul></div><div class="info-card"><h4>💡 Real example</h4><ul><li>You earn <strong>R25,000/month</strong> (R300,000/year) — marginal rate ~26%</li><li>You withdraw <strong>R20,000</strong></li><li>Tax: approximately <strong>R5,200</strong></li><li>You receive approximately <strong>R14,800</strong></li></ul></div><div class="info-card"><h4>📖 What the Revenue Laws prescribe</h4><ul><li>Savings pot withdrawals are taxed under the <strong>normal income tax tables</strong> — not the retirement lump sum tables (this is deliberately less favourable to discourage withdrawals)</li><li>PAYE is deducted at source by the fund at a rate determined by the <strong>SARS tax directive</strong> — the directive considers your total annual income</li><li>If too much or too little tax was deducted, it is <strong>reconciled in your annual tax return</strong></li><li>Multiple withdrawals across different funds in one tax year are <strong>aggregated</strong> for tax purposes — you cannot avoid higher brackets by splitting across funds</li></ul></div><div class="contact-block"><strong>📞 SARS — 0800 00 7277 | www.sars.gov.za</strong></div>`,
    options: [
      { label: "💰 How do I make a withdrawal?", next: "two_pot_access" },
      { label: "⚠️ What scams should I watch for?", next: "two_pot_scams" },
      { label: "🏠 Back to Pension menu", next: "pension_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  two_pot_scams: {
    message: `<strong>Two-Pot scams and misconceptions</strong><div class="info-card"><h4>🚨 Scam 1: "Resign to access your full pension"</h4><ul><li>Under Two-Pot, your <strong>Retirement Component cannot be accessed even if you resign</strong></li><li>Anyone pressuring you to resign is exploiting you</li></ul></div><div class="info-card"><h4>🚨 Scam 2: "We can unlock your pension for a fee"</h4><ul><li>You can apply directly through your fund administrator — <strong>no third party needed</strong></li><li>Never pay upfront to "unlock" your pension</li></ul></div><div class="info-card"><h4>🚨 Scam 3: "Invest your payout for guaranteed returns"</h4><ul><li><strong>Guaranteed high returns are a hallmark of fraud</strong></li><li>Verify any adviser's FSP licence on the FSCA website</li></ul></div><div class="info-card"><h4>📖 What the Regulations say</h4><ul><li>The FSCA has issued <strong>multiple public warnings</strong> about Two-Pot scams — check www.fsca.co.za for the latest alerts</li><li>No third party is authorised to facilitate your withdrawal — <strong>only your registered fund administrator</strong> can process a savings pot claim</li><li>Any person or entity offering to "unlock" or "fast-track" your pension withdrawal is likely committing fraud — report them to the <strong>FSCA and SAPS</strong></li><li>Fund administrators who share your personal information with third parties without consent are in breach of <strong>POPIA</strong> (Protection of Personal Information Act)</li></ul></div><div class="contact-block"><strong>📞 Report scams to FSCA: www.fsca.co.za</strong><br>Pension Funds Adjudicator: 012 346 1738 | www.pfa.org.za</div>`,
    options: [
      { label: "📝 How do I complain about my pension fund?", next: "pension_complaint" },
      { label: "🏠 Back to Pension menu", next: "pension_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  pension_resignation: {
    message: `<strong>What happens to your pension when you resign?</strong><div class="info-card"><h4>📋 Post September 2024 rules</h4><ul><li><strong>Vested Component:</strong> Can be paid out OR transferred to a preservation fund</li><li><strong>Savings Component:</strong> Can be paid out OR transferred</li><li><strong>Retirement Component: CANNOT be paid out</strong> — must be transferred</li></ul></div><div class="info-card"><h4>💡 Key advice</h4><ul><li><strong>Do not cash out your Vested Component</strong> unless absolutely necessary</li><li>Transferring to a <strong>preservation fund</strong> keeps money tax-deferred</li><li>The Retirement Component is permanently protected</li></ul></div><div class="info-card"><h4>📖 What the Regulations prescribe</h4><ul><li>The <strong>"clean break" principle</strong> — on resignation, your fund benefit must be paid or transferred within a prescribed timeframe; funds cannot unreasonably delay payment</li><li>Under s.37C (death benefits) and s.37D (deductions), the fund's board of trustees has specific <strong>fiduciary duties</strong> to act in your interest — they cannot favour the employer</li><li>If you transfer to a <strong>preservation fund</strong>, you are entitled to one withdrawal before retirement — this is prescribed and your preservation fund must allow it</li><li>The Retirement Component under Two-Pot <strong>must be transferred</strong> to your new employer's fund or a preservation fund — it cannot be paid out under any circumstances</li></ul></div><div class="info-card"><h4>⚠️ Employer deductions (s.37D)</h4><ul><li>Employer can ONLY deduct if you <strong>admitted liability in writing</strong> or a <strong>court granted judgment</strong></li><li>Deductions for ordinary resignation are <strong>NOT permitted</strong></li></ul></div><div class="contact-block"><strong>📞 FSCA: www.fsca.co.za</strong><br>Pension Funds Adjudicator: 012 346 1738 | www.pfa.org.za</div>`,
    options: [
      { label: "📝 How do I complain?", next: "pension_complaint" },
      { label: "⚠️ I think I'm being scammed", next: "two_pot_scams" },
      { label: "🏠 Back to Pension menu", next: "pension_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  pension_complaint: {
    message: `<strong>How to complain about your pension fund</strong><div class="info-card"><h4>📋 The Pension Funds Adjudicator (PFA)</h4><ul><li>Independent, <strong>free</strong> complaints body</li><li>Complain within <strong>3 years</strong></li><li>Determination is binding — enforceable like a court order</li></ul></div><div class="info-card"><h4>✅ Step by step</h4><ul><li><strong>Step 1:</strong> Raise the issue with your fund administrator in writing</li><li><strong>Step 2:</strong> Allow at least 30 days to respond</li><li><strong>Step 3:</strong> If unresolved — submit to the <strong>PFA</strong></li></ul></div><div class="info-card"><h4>📖 What the Regulations prescribe</h4><ul><li>The PFA operates under the <strong>Pension Funds Adjudicator Rules</strong> — complaints must be in the prescribed format and include all supporting documents</li><li>The fund must respond to the PFA's request for information within <strong>30 days</strong> — failure to respond may result in a default determination against the fund</li><li>Determinations can be taken on appeal to the <strong>Financial Services Tribunal</strong> and then to the High Court — but the bar for overturning a PFA determination is high</li><li>The PFA has jurisdiction over complaints related to <strong>administration, investment, and distribution of benefits</strong> — but not over disputes that are purely contractual (those go to court)</li></ul></div><div class="contact-block"><strong>📞 Pension Funds Adjudicator</strong><br>012 346 1738 | www.pfa.org.za</div>`,
    options: [
      { label: "⚠️ I think I'm being scammed", next: "two_pot_scams" },
      { label: "🏠 Back to Pension menu", next: "pension_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  cpa_main: {
    message: `The <strong>Consumer Protection Act (CPA)</strong> — Act 68 of 2008 — gives you powerful rights whenever you buy goods or services in South Africa.<br><br>We'll cover both <strong>what the Act says</strong> and <strong>what the CPA Regulations prescribe</strong> (the detailed rules suppliers must follow).<br><br>What's your situation?`,
    options: [
      { label: "🔧 I received defective or broken goods", next: "cpa_defective" },
      { label: "📜 Unfair contract terms or I want to cancel", next: "cpa_contracts" },
      { label: "📦 Goods delivered that I didn't order", next: "cpa_unsolicited" },
      { label: "📣 Misled by advertising or a salesperson", next: "cpa_misleading" },
      { label: "⚠️ Being pressured into a pyramid scheme", next: "cpa_pyramid" },
      { label: "📝 How do I complain under the CPA?", next: "cpa_complaint" },
      { label: "↩️ Back to main menu", next: "start" },
    ],
  },

  cpa_defective: {
    message: `<strong>Your right to safe, good quality goods (Sections 55–56, CPA)</strong><div class="info-card"><h4>📋 The 6-Month Implied Warranty (s.56)</h4><ul><li>Within <strong>6 months of delivery</strong>, if goods are defective — return them at the <strong>supplier's expense</strong></li><li>The supplier MUST: <strong>(a) repair, (b) replace, or (c) refund</strong></li><li>If repaired goods fail again within <strong>3 months</strong> — must replace or refund</li><li>"No returns" policies are <strong>void</strong> for defective goods</li></ul></div><div class="info-card"><h4>📖 What the Regulations say</h4><ul><li>Suppliers must display their <strong>return, refund, and exchange policy</strong> in a visible location — but this policy cannot override your CPA rights (CPA Reg 33(1))</li><li>When returning defective goods, you are entitled to your <strong>choice</strong> of repair, replacement, or refund — the supplier cannot force one option on you (s.56(3))</li><li>The supplier bears the <strong>cost of return</strong> for defective goods — they cannot charge you postage or handling fees</li><li>For goods that fail within 6 months, there is a <strong>presumption the defect existed at time of delivery</strong> — the supplier must prove otherwise</li></ul></div><div class="info-card"><h4>✅ What to do</h4><ul><li><strong>Step 1:</strong> Return the goods in writing — cite s.56 CPA</li><li><strong>Step 2:</strong> Keep proof of purchase and all correspondence</li><li><strong>Step 3:</strong> If refused — report to the <strong>NCC or relevant Ombud</strong></li></ul></div><div class="contact-block"><strong>📞 NCC — 0860 266 786 | www.thencc.org.za</strong><br>Consumer Goods & Services Ombud: 0860 000 272 | www.cgso.org.za</div>`,
    options: [
      { label: "📝 How do I complain formally?", next: "cpa_complaint" },
      { label: "🏠 Back to Consumer Rights menu", next: "cpa_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  cpa_contracts: {
    message: `<strong>Your right to fair contracts and cancellation (Sections 14, 48–51, CPA)</strong><div class="info-card"><h4>📋 Unfair terms are void (s.48–51)</h4><ul><li>Excessively one-sided terms can be set aside by a court</li><li>"No refund" for defective goods is <strong>void</strong></li><li>Terms that waive your CPA rights are <strong>void</strong></li><li>Hidden fine print is not enforceable (s.49)</li></ul></div><div class="info-card"><h4>📋 Fixed-term contract cancellation (s.14)</h4><ul><li>Cancel any fixed-term agreement with <strong>20 business days' written notice</strong></li><li>Supplier may charge a <strong>reasonable cancellation penalty</strong></li></ul></div><div class="info-card"><h4>📋 Cooling-off period (s.16)</h4><ul><li>Door-to-door, phone, or online sales: <strong>5 business days to cancel</strong>, no reason needed</li><li>Refund within <strong>15 business days</strong></li></ul></div><div class="info-card"><h4>📖 What the Regulations prescribe</h4><ul><li>Fixed-term agreements may <strong>not exceed 24 months</strong> (CPA Reg 5(1)) unless you specifically request a longer term in writing</li><li>The supplier must notify you <strong>40–80 business days before expiry</strong> that your contract is ending and give you options to renew, modify, or cancel (s.14(2))</li><li>The <strong>reasonable cancellation penalty</strong> must not exceed a prescribed formula — it must be proportional and not punitive (CPA Reg 5(2))</li><li>Auto-renewal without proper notice is <strong>prohibited</strong> — you are not bound by a renewed contract if you were not properly notified</li></ul></div><div class="contact-block"><strong>📞 NCC — 0860 266 786 | www.thencc.org.za</strong></div>`,
    options: [
      { label: "📝 How do I complain formally?", next: "cpa_complaint" },
      { label: "🏠 Back to Consumer Rights menu", next: "cpa_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  cpa_unsolicited: {
    message: `<strong>Unsolicited goods (Section 21, CPA)</strong><br><br>If goods arrived without you ordering them — <strong>you do not have to pay</strong>.<div class="info-card"><h4>📋 Your rights (s.21)</h4><ul><li><strong>No obligation to pay</strong> for goods you did not order</li><li>If you paid already — recover the amount <strong>with interest</strong></li><li>If the supplier doesn't collect within <strong>20 business days</strong> — the goods become <strong>yours</strong></li></ul></div><div class="info-card"><h4>📖 What the Regulations say</h4><ul><li>Any agreement entered into as a result of <strong>unsolicited direct marketing</strong> (phone, email, door-to-door) can be cancelled within <strong>5 business days</strong> without penalty (s.16, CPA Reg 4)</li><li>The supplier must provide a <strong>cooling-off notice</strong> informing you of your right to cancel — if they didn't, the cancellation period extends</li><li>Any payment made for unsolicited goods must be refunded within <strong>15 business days</strong> of your cancellation request</li></ul></div><div class="info-card"><h4>✅ What to do</h4><ul><li><strong>Step 1:</strong> Do NOT pay anything</li><li><strong>Step 2:</strong> Notify the supplier in writing to collect within 20 business days</li><li><strong>Step 3:</strong> If they ignore you — the goods are yours</li><li><strong>Step 4:</strong> If they demand payment — report to the <strong>NCC</strong></li></ul></div><div class="contact-block"><strong>📞 NCC — 0860 266 786 | www.thencc.org.za</strong></div>`,
    options: [
      { label: "📝 How do I complain formally?", next: "cpa_complaint" },
      { label: "🏠 Back to Consumer Rights menu", next: "cpa_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  cpa_misleading: {
    message: `<strong>False advertising and misleading marketing (Sections 29–41, CPA)</strong><div class="info-card"><h4>🚫 Prohibited practices</h4><ul><li><strong>False, misleading, or deceptive</strong> representations (s.41)</li><li><strong>"Bait marketing"</strong> — advertising without reasonable stock (s.30)</li><li>Fake "was/now" pricing</li><li>Charging <strong>more than the lowest displayed price</strong> (s.23)</li><li>Using <strong>coercion or undue influence</strong> (s.40)</li></ul></div><div class="info-card"><h4>📖 What the Regulations prescribe</h4><ul><li>Promotional competitions must comply with strict rules — including odds disclosure, clear terms, and no purchase requirement beyond reasonable cost (CPA Reg 11–13)</li><li>Lay-by agreements must be in writing, and if you cancel, the supplier may only deduct up to <strong>1% of the purchase price</strong> as a cancellation charge (CPA Reg 28(3))</li><li>Price displays must be <strong>inclusive of VAT</strong> and any unavoidable charges — the displayed price is the maximum you can be charged (s.23)</li><li>"Was/now" pricing: the "was" price must have been charged for a <strong>genuine period</strong> — fabricated reference prices are a criminal offence</li></ul></div><div class="info-card"><h4>✅ What to do</h4><ul><li><strong>Step 1:</strong> Document everything — screenshots, receipts</li><li><strong>Step 2:</strong> Demand the advertised price or a refund in writing</li><li><strong>Step 3:</strong> If refused — report to the <strong>NCC</strong></li><li><strong>Step 4:</strong> For false advertising — also report to the <strong>Advertising Regulatory Board</strong></li></ul></div><div class="contact-block"><strong>📞 NCC — 0860 266 786</strong><br>Advertising Regulatory Board: www.arb.org.za</div>`,
    options: [
      { label: "📝 How do I complain formally?", next: "cpa_complaint" },
      { label: "🏠 Back to Consumer Rights menu", next: "cpa_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  cpa_pyramid: {
    message: `<strong>Pyramid schemes & scams (Sections 42–43, CPA)</strong><br><br>These are <strong>criminal offences under the CPA</strong>.<div class="info-card"><h4>🚨 What makes it a pyramid scheme? (s.43)</h4><ul><li>Earn money <strong>primarily by recruiting new members</strong></li><li>New recruits pay to join and money flows up</li><li>Eventually collapses — most participants lose everything</li></ul></div><div class="info-card"><h4>🚨 Multiplication Schemes (s.43(3))</h4><ul><li>Promises returns of <strong>more than 20% above Repo Rate</strong> — illegal</li><li>Often presented as "guaranteed returns"</li></ul></div><div class="info-card"><h4>📖 What the Regulations say</h4><ul><li>The CPA Regulations prescribe the <strong>difference between legal direct marketing and illegal pyramid schemes</strong> — legitimate MLM companies earn revenue primarily from <strong>product sales to end consumers</strong>, not from recruitment fees (CPA Reg 35)</li><li>Any scheme requiring a participant to make a <strong>payment primarily to join</strong> or that rewards recruitment over genuine sales is prohibited</li><li>Participants in a pyramid scheme may be held <strong>jointly liable</strong> — even if you were a victim, promoting the scheme to others creates liability</li><li>The National Consumer Tribunal can impose <strong>administrative fines of up to 10% of annual turnover</strong> or R1 million on operators</li></ul></div><div class="info-card"><h4>✅ What to do</h4><ul><li><strong>Do not pay anything</strong> until verified with a professional</li><li>Check for an <strong>FSP licence</strong> on www.fsca.co.za</li><li>Report to the <strong>NCC</strong> and <strong>FSCA</strong></li><li>Report fraud to <strong>SAPS</strong></li></ul></div><div class="contact-block"><strong>📞 NCC — 0860 266 786</strong><br>FSCA: www.fsca.co.za | SAPS: 10111</div>`,
    options: [
      { label: "📝 How do I complain formally?", next: "cpa_complaint" },
      { label: "🏠 Back to Consumer Rights menu", next: "cpa_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  cpa_complaint: {
    message: `<strong>How to complain under the CPA</strong><div class="info-card"><h4>📋 Step-by-step</h4><ul><li><strong>Step 1:</strong> Complain directly to the supplier in writing</li><li><strong>Step 2:</strong> If the industry has an Ombud — go there first</li><li><strong>Step 3:</strong> Lodge a formal complaint with the <strong>NCC</strong></li><li><strong>Step 4:</strong> The NCC can issue compliance notices, refer to the NCT, or achieve consent orders</li></ul></div><div class="info-card"><h4>📖 What the Regulations prescribe</h4><ul><li>Industry codes of conduct registered under the CPA have <strong>legal force</strong> — a breach of an industry code is a breach of the Act (s.82)</li><li>The NCC can issue a <strong>compliance notice</strong> giving the supplier a deadline to fix the issue — non-compliance is a criminal offence (s.100)</li><li>The Consumer Tribunal can award <strong>damages and order compensation</strong> — including consequential losses you suffered (s.76)</li><li>You may also approach the <strong>Equality Court</strong> if you were discriminated against in the provision of goods or services (s.10)</li></ul></div><div class="info-card"><h4>📋 Which Ombud?</h4><ul><li><strong>General goods/retail:</strong> CGSO — 0860 000 272</li><li><strong>Motor vehicles:</strong> MIOSA — 086 164 6672</li><li><strong>Financial advice:</strong> FAIS Ombud — 0860 324 766</li><li><strong>Short-term insurance:</strong> 0860 726 890</li></ul></div><div class="contact-block"><strong>📞 National Consumer Commission (NCC)</strong><br>0860 266 786 | complaints@thencc.org.za | www.thencc.org.za</div>`,
    options: [
      { label: "🏠 Back to Consumer Rights menu", next: "cpa_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  smme_main: {
    message: `💼 <strong>Business Funding & Growth</strong><br><br>South Africa has billions of rands set aside for Black-owned and small businesses. The challenge is knowing where to look.<br><br><strong>Where are you in your journey?</strong>`,
    options: [
      { label: "🌱 Just starting out (idea or under 1 year)", next: "smme_just_starting" },
      { label: "🏗️ Established — need a loan or equity", next: "smme_government" },
      { label: "🎁 I want a grant (no repayment)", next: "smme_grants" },
      { label: "🤝 I want to supply a big company (ESD)", next: "smme_esd" },
      { label: "⚡ I need fast funding — private lenders", next: "smme_private" },
      { label: "↩️ Back to main menu", next: "start" },
    ],
  },

  smme_just_starting: {
    message: `🌱 <strong>Funding for Startups & Early-Stage Businesses</strong><div class="info-card"><h4>🎓 NYDA — National Youth Development Agency</h4><ul><li><strong>Who:</strong> Young South Africans aged <strong>18–35</strong></li><li><strong>What:</strong> Business grants of <strong>R1,000 – R250,000</strong> — non-repayable</li><li><strong>Bonus:</strong> Mentorship, training, and incubation support</li><li>📞 0800 52 52 52 | www.nyda.gov.za</li></ul></div><div class="info-card"><h4>📚 SEDA — Small Enterprise Development Agency</h4><ul><li>Free business registration support, mentorship, training, market access</li><li>SEDA accreditation strengthens your applications everywhere else</li><li>📞 0860 103 703 | www.seda.org.za</li></ul></div><div class="info-card"><h4>💡 Tips for early-stage success</h4><ul><li>Register with <strong>CIPC</strong> — costs as little as R125</li><li>Open a dedicated business bank account</li><li>Build a simple business plan (SEDA can help for free)</li><li>Keep SARS tax compliance up to date</li></ul></div>`,
    options: [
      { label: "🏗️ Bigger loans when I'm ready?", next: "smme_government" },
      { label: "🎁 Other grants available?", next: "smme_grants" },
      { label: "🤝 How to become a supplier to big companies?", next: "smme_esd" },
      { label: "💼 Back to Business Funding menu", next: "smme_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  smme_government: {
    message: `🏗️ <strong>Government & Development Finance</strong><div class="info-card"><h4>💰 SEFA — Small Enterprise Finance Agency</h4><ul><li><strong>Loan range:</strong> R50,000 – R15 million</li><li>Below-market rates (prime linked, often 5–8%)</li><li>📞 0860 663 7786 | www.sefa.org.za</li></ul></div><div class="info-card"><h4>🌍 NEF — National Empowerment Fund</h4><ul><li><strong>Funding range:</strong> R250,000 – R75 million</li><li><strong>51%+ Black ownership</strong> required</li><li>5 Specialist Funds: uMnotho, iMbewu, Rural & Community, Strategic Projects, Women Empowerment</li><li>📞 0861 843 633 | www.nef.org.za</li></ul></div><div class="info-card"><h4>🏭 IDC — Industrial Development Corporation</h4><ul><li><strong>Funding range:</strong> R1 million – R1 billion+</li><li>Manufacturing, agro-processing, mining, green energy, tech</li><li>📞 0860 693 888 | www.idc.co.za</li></ul></div>`,
    options: [
      { label: "🎁 Tell me about grants", next: "smme_grants" },
      { label: "🤝 What about ESD / corporate funding?", next: "smme_esd" },
      { label: "⚡ Faster private options", next: "smme_private" },
      { label: "💼 Back to Business Funding menu", next: "smme_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  smme_grants: {
    message: `🎁 <strong>Grants — Money You Don't Have to Pay Back</strong><div class="info-card"><h4>🏭 BBSDP — Black Business Supplier Development Programme</h4><ul><li><strong>Up to R1 million</strong></li><li>51%+ Black-owned, 1+ year in operation, R250k–R35m turnover</li><li>Equipment: government pays <strong>50%</strong> (up to R800k)</li><li>Training: government pays <strong>80%</strong> (up to R200k)</li><li>📞 0861 843 384 | www.thedtic.gov.za</li></ul></div><div class="info-card"><h4>🌐 EMIA — Export Marketing & Investment Assistance</h4><ul><li>Reimburses costs of attending international trade shows and export research</li></ul></div><div class="info-card"><h4>⚠️ Grant success tips</h4><ul><li>Apply early — budgets run out</li><li>Be tax-compliant (SARS tax clearance is mandatory)</li><li>Get CIPC registration and B-BBEE certificate ready</li><li><strong>Never pay anyone to "guarantee" a government grant</strong></li></ul></div>`,
    options: [
      { label: "🏗️ Government loans (SEFA, NEF, IDC)", next: "smme_government" },
      { label: "🤝 ESD / corporate funding", next: "smme_esd" },
      { label: "⚡ Private / fast funding", next: "smme_private" },
      { label: "💼 Back to Business Funding menu", next: "smme_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  smme_esd: {
    message: `🤝 <strong>ESD & Corporate Funding</strong><br><br>Under B-BBEE law, large companies <em>must</em> invest in developing Black-owned SMMEs.<div class="info-card"><h4>📌 What ESD offers you</h4><ul><li><strong>Grants, soft loans, equipment, training, mentorship, guaranteed contracts</strong></li><li>You don't need to be an existing supplier</li></ul></div><div class="info-card"><h4>🏢 Major ESD Programmes</h4><ul><li>🛒 <strong>Shoprite Checkers:</strong> Food/agri SMMEs</li><li>⛽ <strong>Sasol:</strong> Energy-sector suppliers</li><li>🏦 <strong>Standard Bank / Absa / Nedbank / FNB:</strong> All have ESD programmes</li><li>📱 <strong>MTN / Vodacom / Telkom:</strong> ICT and tech suppliers</li></ul></div><div class="info-card"><h4>🎯 How to approach ESD</h4><ul><li>Identify 3–5 large companies in your sector</li><li>Search their website for "supplier development" or "ESD"</li><li>Register on their supplier portal</li><li>Have B-BBEE certificate, CIPC docs, and tax clearance ready</li></ul></div>`,
    options: [
      { label: "🏗️ Government DFI loans", next: "smme_government" },
      { label: "🎁 Grants instead", next: "smme_grants" },
      { label: "⚡ Private / fast funding", next: "smme_private" },
      { label: "💼 Back to Business Funding menu", next: "smme_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  smme_private: {
    message: `⚡ <strong>Private & Alternative Funding</strong><div class="info-card"><h4>🏦 Business Partners Limited</h4><ul><li><strong>R500,000 – R50 million</strong></li><li>For established SMEs (3+ years)</li><li>📞 0861 227 227 | www.businesspartners.co.za</li></ul></div><div class="info-card"><h4>⚡ Fintech Lenders</h4><ul><li>🟢 <strong>Lula:</strong> Up to R5m based on bank account | www.lula.co.za</li><li>🟡 <strong>Merchant Capital:</strong> Advances on card turnover | www.merchantcapital.co.za</li><li>🔵 <strong>Retail Capital:</strong> Revenue-based for R150k+ turnover | www.retailcapital.co.za</li><li>🟣 <strong>Bridgement:</strong> Revolving credit for 6+ months trading | www.bridgement.com</li></ul></div><div class="info-card"><h4>⚠️ Watch out for</h4><ul><li>Any lender charging more than <strong>5% per month</strong> is likely predatory</li><li>Never pay upfront "processing fees" — this is a <strong>scam</strong></li><li>Check NCR registration: 0860 627 627 | www.ncr.org.za</li></ul></div>`,
    options: [
      { label: "🏗️ Government DFI funding", next: "smme_government" },
      { label: "🎁 Grants I qualify for?", next: "smme_grants" },
      { label: "🤝 ESD / corporate backing?", next: "smme_esd" },
      { label: "💼 Back to Business Funding menu", next: "smme_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  invest_main: {
    message: `📈 <strong>Investing — Build & Grow Your Wealth</strong><br><br>Building wealth starts with understanding <strong>how money grows</strong>.<div class="info-card" style="background:#fff8e1;border-left:4px solid #f59e0b;"><strong>⚠️ This is financial education — not personal advice.</strong> Only licensed FSPs may give personalised advice. Verify at <strong>www.fsca.co.za</strong>.</div><br>What would you like to learn?`,
    options: [
      { label: "🧠 What kind of investor am I? (Risk profile)", next: "invest_risk_profile" },
      { label: "🏦 SA investment products", next: "invest_products" },
      { label: "📊 Explain asset classes", next: "invest_asset_classes" },
      { label: "🧾 TFSA vs Retirement Annuity", next: "invest_tfsa_vs_ra" },
      { label: "🚨 How to spot investment scams", next: "invest_scams" },
      { label: "↩️ Back to main menu", next: "start" },
    ],
  },

  invest_risk_profile: {
    message: `🧠 <strong>Understanding Your Risk Profile</strong><div class="info-card"><h4>1️⃣ Risk Need — What return do you need?</h4><ul><li>What are you investing for, and when do you need the money?</li></ul></div><div class="info-card"><h4>2️⃣ Risk Capacity — Can you afford to lose money?</h4><ul><li>Stable income, no debt, long time horizon = high capacity</li><li><strong>Rule:</strong> Never invest money you need within 2 years in anything other than cash</li></ul></div><div class="info-card"><h4>3️⃣ Risk Tolerance — How do you feel about losses?</h4><ul><li>If R100,000 dropped to R75,000 — would you sell, wait, or invest more?</li></ul></div><br><strong>What best describes you?</strong>`,
    options: [
      { label: "🛡️ Protect my money", next: "invest_conservative" },
      { label: "⚖️ Balance of safety and growth", next: "invest_moderate" },
      { label: "🚀 Maximise growth — I can handle ups and downs", next: "invest_aggressive" },
      { label: "🤔 Not sure — help me", next: "invest_risk_quiz" },
      { label: "📈 Back to Investing menu", next: "invest_main" },
    ],
  },

  invest_risk_quiz: {
    message: `🤔 <strong>Quick Risk Profile Assessment</strong><div class="info-card"><h4>❓ Q1: Time horizon</h4><ul><li><strong>A.</strong> 1–3 years</li><li><strong>B.</strong> 3–7 years</li><li><strong>C.</strong> 7+ years</li></ul></div><div class="info-card"><h4>❓ Q2: If investment dropped 25% in one year</h4><ul><li><strong>A.</strong> I would sell immediately</li><li><strong>B.</strong> I'd be uncomfortable but wait</li><li><strong>C.</strong> I'd see it as an opportunity to invest more</li></ul></div><div class="info-card"><h4>❓ Q3: Your financial situation</h4><ul><li><strong>A.</strong> Variable income, debts, or dependants</li><li><strong>B.</strong> Stable income and a small emergency fund</li><li><strong>C.</strong> Stable income, emergency fund, no urgent pressures</li></ul></div><br><strong>Mostly A → Conservative | Mostly B → Moderate | Mostly C → Aggressive</strong>`,
    options: [
      { label: "🛡️ Mostly A — Conservative", next: "invest_conservative" },
      { label: "⚖️ Mostly B — Moderate", next: "invest_moderate" },
      { label: "🚀 Mostly C — Aggressive", next: "invest_aggressive" },
      { label: "📈 Back to Investing menu", next: "invest_main" },
    ],
  },

  invest_conservative: {
    message: `🛡️ <strong>Conservative Investor Profile</strong><div class="info-card"><h4>📋 What this looks like</h4><ul><li><strong>Time horizon:</strong> 1–3 years</li><li><strong>Asset mix:</strong> 80–100% cash & bonds</li><li><strong>Expected return (SA):</strong> ~7–10% per year</li></ul></div><div class="info-card"><h4>🏦 Suitable assets</h4><ul><li>✅ Money market funds (~8–9%)</li><li>✅ Fixed deposits / savings accounts</li><li>✅ RSA Retail Savings Bonds (from R1,000)</li><li>✅ Bond unit trusts / income funds</li></ul></div><div class="info-card"><h4>💡 Smart moves</h4><ul><li>Use a <strong>Tax-Free Savings Account</strong> with a money market or bond fund</li><li>Set up a <strong>Retirement Annuity</strong> for the tax deduction</li><li>Consider <strong>RSA Inflation-Linked Savings Bonds</strong></li></ul></div>`,
    options: [
      { label: "🏦 Show me all SA investment products", next: "invest_products" },
      { label: "🧾 TFSA vs Retirement Annuity", next: "invest_tfsa_vs_ra" },
      { label: "📈 Back to Investing menu", next: "invest_main" },
    ],
  },

  invest_moderate: {
    message: `⚖️ <strong>Moderate / Balanced Investor Profile</strong><div class="info-card"><h4>📋 What this looks like</h4><ul><li><strong>Time horizon:</strong> 5–7 years</li><li><strong>Asset mix:</strong> ~40–50% bonds/cash + ~50–60% equities & property</li><li><strong>Expected return (SA):</strong> ~11–14% per year</li></ul></div><div class="info-card"><h4>🏦 Suitable assets</h4><ul><li>✅ Multi-asset balanced funds</li><li>✅ Mix of bond funds + equity ETFs</li><li>✅ Listed property (REITs)</li><li>✅ Offshore exposure for diversification</li></ul></div><div class="info-card"><h4>💡 Smart moves</h4><ul><li>Use a <strong>Retirement Annuity</strong> — up to 27.5% of income is tax-deductible</li><li>Layer a <strong>TFSA</strong> on top</li><li>Invest monthly via debit order</li></ul></div>`,
    options: [
      { label: "🏦 Show me all SA investment products", next: "invest_products" },
      { label: "🧾 TFSA vs Retirement Annuity", next: "invest_tfsa_vs_ra" },
      { label: "📈 Back to Investing menu", next: "invest_main" },
    ],
  },

  invest_aggressive: {
    message: `🚀 <strong>Aggressive / Growth Investor Profile</strong><div class="info-card"><h4>📋 What this looks like</h4><ul><li><strong>Time horizon:</strong> 10+ years</li><li><strong>Asset mix:</strong> 80–100% equities (SA + global)</li><li><strong>Expected return (SA equities):</strong> ~15–18% per year long-term</li></ul></div><div class="info-card"><h4>🏦 Suitable assets</h4><ul><li>✅ SA equity unit trusts / ETFs (e.g., Satrix 40)</li><li>✅ Global equity ETFs (Satrix MSCI World, Sygnia S&P500)</li><li>✅ Sector-specific and small/mid-cap funds</li><li>⚠️ Crypto & forex: only 5–10% of portfolio at most</li></ul></div><div class="info-card"><h4>💡 Smart moves</h4><ul><li><strong>Max out TFSA first</strong> — R46,000/year in a high-equity fund</li><li>Use RA for the tax deduction</li><li><strong>Diversify globally</strong></li><li>Stay invested through downturns — panic selling is the #1 reason for underperformance</li></ul></div>`,
    options: [
      { label: "🏦 Show me all SA investment products", next: "invest_products" },
      { label: "🧾 TFSA vs Retirement Annuity", next: "invest_tfsa_vs_ra" },
      { label: "📈 Back to Investing menu", next: "invest_main" },
    ],
  },

  invest_asset_classes: {
    message: `📊 <strong>SA Asset Classes Explained</strong><div class="info-card"><h4>💵 1. Cash & Money Market — Very Low Risk</h4><ul><li>Savings accounts, money market funds, fixed deposits</li><li>~8–10% nominal / ~1–2% real</li><li>Best for: Emergency fund, short-term goals under 3 years</li></ul></div><div class="info-card"><h4>📜 2. Bonds — Low to Medium Risk</h4><ul><li>RSA Government Bonds, corporate bonds</li><li>~10–11% nominal / ~3–4% real</li><li>Best for: Medium-term goals (3–7 years)</li></ul></div><div class="info-card"><h4>🏢 3. Listed Property (REITs) — Medium Risk</h4><ul><li>~12–14% nominal long-term</li><li>Best for: Income (dividends) plus growth</li></ul></div><div class="info-card"><h4>📈 4. Equities (Shares) — High short-term, lower long-term risk</h4><ul><li>~15–18% nominal long-term</li><li>Over any 10-year SA period, equities beat inflation</li></ul></div><div class="info-card"><h4>🌐 5. Offshore / Global</h4><ul><li>SA equities are only ~0.4% of global market</li><li>Individuals may send up to <strong>R10 million/year</strong> offshore</li></ul></div>`,
    options: [
      { label: "🧠 Help me find my risk profile", next: "invest_risk_profile" },
      { label: "🏦 Show me SA investment products", next: "invest_products" },
      { label: "📈 Back to Investing menu", next: "invest_main" },
    ],
  },

  invest_products: {
    message: `🏦 <strong>SA Investment Products</strong><div class="info-card"><h4>🟢 Tax-Free Savings Account (TFSA)</h4><ul><li>R46,000/year | R500,000 lifetime maximum</li><li><strong>Zero tax</strong> on growth — no CGT, no dividends tax</li><li>Withdraw anytime — but withdrawals reduce lifetime limit</li></ul></div><div class="info-card"><h4>🔵 Retirement Annuity (RA)</h4><ul><li>Contributions deductible up to <strong>27.5% of income</strong> (max R350,000/year)</li><li>Locked until age 55</li><li>At retirement: up to 1/3 as lump sum (first R550,000 tax-free)</li></ul></div><div class="info-card"><h4>🟡 Unit Trusts</h4><ul><li>Pooled funds from money market to pure equity</li><li>No lock-up period for most</li></ul></div><div class="info-card"><h4>🟠 Exchange-Traded Funds (ETFs)</h4><ul><li>Tracks an index — very low fees (0.1–0.5% TER)</li><li>Available via EasyEquities, Satrix, Sygnia</li></ul></div><div class="info-card"><h4>🔴 RSA Retail Savings Bonds</h4><ul><li>Government-backed, from R1,000</li><li>2, 3, and 5-year terms</li></ul></div>`,
    options: [
      { label: "🧾 TFSA vs RA — which should I choose?", next: "invest_tfsa_vs_ra" },
      { label: "🧠 Find my risk profile", next: "invest_risk_profile" },
      { label: "🚨 How to spot investment scams", next: "invest_scams" },
      { label: "📈 Back to Investing menu", next: "invest_main" },
    ],
  },

  invest_tfsa_vs_ra: {
    message: `🧾 <strong>TFSA vs Retirement Annuity</strong><div class="info-card"><h4>📋 Side-by-Side</h4><ul><li><strong>Tax on contributions:</strong> RA ✅ deductible | TFSA ❌ not deductible</li><li><strong>Tax on growth:</strong> Both ✅ tax-free</li><li><strong>Tax on withdrawal:</strong> RA ⚠️ taxed at retirement | TFSA ✅ zero tax ever</li><li><strong>Access:</strong> RA 🔒 age 55 | TFSA 🔓 anytime</li></ul></div><div class="info-card"><h4>🎯 Prioritise RA if:</h4><ul><li>You earn above R250,000/year</li><li>You are self-employed with no employer pension</li><li>You want to reduce taxable income now</li></ul></div><div class="info-card"><h4>🎯 Prioritise TFSA if:</h4><ul><li>You're a younger investor (20–40 years of compounding)</li><li>You want flexibility before age 55</li><li>You're in a lower tax bracket</li></ul></div><div class="info-card"><h4>💡 Recommended order for most South Africans</h4><ul><li>1️⃣ Emergency fund (3–6 months)</li><li>2️⃣ Employer pension (take the full match)</li><li>3️⃣ Retirement Annuity</li><li>4️⃣ TFSA (R46,000/year)</li><li>5️⃣ Discretionary investing</li></ul></div>`,
    options: [
      { label: "🧠 What's my risk profile?", next: "invest_risk_profile" },
      { label: "🏦 Show all investment products", next: "invest_products" },
      { label: "🚨 How to spot scams", next: "invest_scams" },
      { label: "📈 Back to Investing menu", next: "invest_main" },
    ],
  },

  invest_scams: {
    message: `🚨 <strong>Investment Scams — Protect Yourself</strong><div class="info-card"><h4>🚩 Warning signs</h4><ul><li><strong>"Guaranteed returns" of 20–50%/month</strong> — does not exist</li><li><strong>Pressure to invest quickly</strong></li><li><strong>Unsolicited cold calls or DMs</strong></li><li><strong>Social media "proof"</strong> and flashy lifestyle posts</li><li><strong>Referral bonuses</strong> — hallmark of Ponzi scheme</li><li><strong>No clear product or business</strong></li></ul></div><div class="info-card"><h4>✅ Before investing — always check</h4><ul><li>Is the company a <strong>licensed FSP</strong>? Check at www.fsca.co.za</li><li>Did they do a <strong>needs analysis and risk profile</strong>?</li><li>Did they provide a <strong>written Record of Advice</strong>?</li></ul></div><div class="info-card"><h4>💔 SA's biggest scams</h4><ul><li><strong>Mirror Trading International:</strong> ~R9.3 billion lost</li><li><strong>Africrypt:</strong> ~R54 billion in Bitcoin allegedly taken</li><li><strong>BHI Trust (Tannenbaum):</strong> R12 billion lost</li></ul></div><div class="contact-block"><strong>📞 Report investment fraud</strong><br>FSCA: 0800 110 443 | info@fsca.co.za<br>Hawks: 0800 205 005</div>`,
    options: [
      { label: "🧠 Learn about risk profiles", next: "invest_risk_profile" },
      { label: "🏦 Legitimate SA investment products", next: "invest_products" },
      { label: "📈 Back to Investing menu", next: "invest_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  cfp_main: {
    message: `🧩 <strong>Holistic Financial Planning</strong><br><br>A <strong>Certified Financial Planner (CFP®)</strong> brings all your finances together into one coordinated plan.<div class="info-card"><h4>🔄 The CFP® 6-Step Process</h4><ul><li><strong>1.</strong> Establish the relationship</li><li><strong>2.</strong> Gather your data</li><li><strong>3.</strong> Analyse your current position</li><li><strong>4.</strong> Develop a written plan</li><li><strong>5.</strong> Implement</li><li><strong>6.</strong> Monitor & review</li></ul></div><br>Which pillar would you like to explore?`,
    options: [
      { label: "💰 Budgeting & Cash Flow", next: "cfp_cashflow" },
      { label: "🏋️ Debt Management", next: "cfp_debt" },
      { label: "🛡️ Insurance & Protection", next: "cfp_protection" },
      { label: "📝 Estate Planning & Wills", next: "cfp_estate" },
      { label: "🧾 Tax Planning", next: "cfp_tax" },
      { label: "🏁 Retirement Planning", next: "cfp_retirement" },
      { label: "🔍 How to find a CFP®", next: "cfp_find_planner" },
      { label: "↩️ Back to main menu", next: "start" },
    ],
  },

  cfp_cashflow: {
    message: `💰 <strong>Budgeting & Cash Flow</strong><div class="info-card"><h4>📊 The 50/30/20 Rule</h4><ul><li>🏠 <strong>50% → Needs:</strong> Rent, groceries, transport, insurance</li><li>🎬 <strong>30% → Wants:</strong> Entertainment, dining out, streaming</li><li>💸 <strong>20% → Savings & Debt:</strong> Emergency fund, investments, extra debt payments</li></ul></div><div class="info-card"><h4>🔍 4 practical steps</h4><ul><li><strong>Step 1:</strong> Track every rand for one month</li><li><strong>Step 2:</strong> Categorise as Need, Want, or Saving</li><li><strong>Step 3:</strong> Identify your "money leaks"</li><li><strong>Step 4:</strong> Set up a savings debit order on payday</li></ul></div>`,
    options: [
      { label: "🏋️ Help managing my debt", next: "cfp_debt" },
      { label: "🆘 Emergency fund — how much?", next: "cfp_emergency" },
      { label: "🧩 Back to Financial Planning menu", next: "cfp_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  cfp_emergency: {
    message: `🆘 <strong>Building Your Emergency Fund</strong><div class="info-card"><h4>💡 How much do you need?</h4><ul><li>🏠 <strong>Single income:</strong> 6 months of essential expenses</li><li>👫 <strong>Dual income:</strong> 3 months</li><li>💼 <strong>Self-employed:</strong> 6–12 months</li></ul></div><div class="info-card"><h4>🏦 Where to keep it</h4><ul><li>✅ Money market account (~8–9% p.a.)</li><li>✅ 32-day notice deposit</li><li>❌ NOT in the stock market</li><li>❌ NOT in your current account</li><li>❌ NOT inside your TFSA</li></ul></div><div class="info-card"><h4>🎯 How to build from zero</h4><ul><li>Focus on 1 month's expenses first</li><li>Set up a separate "Emergency" account</li><li>Automate a debit order on payday</li></ul></div>`,
    options: [
      { label: "💰 Back to Budgeting", next: "cfp_cashflow" },
      { label: "🏋️ Tackle my debt", next: "cfp_debt" },
      { label: "🧩 Back to Financial Planning menu", next: "cfp_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  cfp_debt: {
    message: `🏋️ <strong>Debt Management</strong><div class="info-card"><h4>🎯 Choose your strategy</h4><ul><li>⛄ <strong>Snowball:</strong> Pay off smallest balance first — quick wins for motivation</li><li>🌊 <strong>Avalanche:</strong> Pay off highest interest first — saves the most money</li></ul></div><div class="info-card"><h4>⚡ SA Debt Priority Order</h4><ul><li>1️⃣ Pay-day loans (30–60% p.a.)</li><li>2️⃣ Store credit (30–36% p.a.)</li><li>3️⃣ Credit cards (18–22% p.a.)</li><li>4️⃣ Personal loans (12–24% p.a.)</li><li>5️⃣ Vehicle finance (9–13% p.a.)</li><li>6️⃣ Home loan (~11.25% p.a.)</li></ul></div><div class="info-card"><h4>🆘 If over-indebted</h4><ul><li>Apply for <strong>Debt Review</strong> (NCA Section 86)</li><li>Debt review is NOT blacklisting — it's legal protection</li><li>NCR — 0860 627 627 | www.ncr.org.za</li></ul></div>`,
    options: [
      { label: "💰 Back to Budgeting", next: "cfp_cashflow" },
      { label: "🛡️ Sort out my insurance", next: "cfp_protection" },
      { label: "🏦 Credit rights (NCA)", next: "nca_main" },
      { label: "🧩 Back to Financial Planning menu", next: "cfp_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  cfp_protection: {
    message: `🛡️ <strong>Insurance & Protection</strong><div class="info-card"><h4>☠️ Life Cover</h4><ul><li>Pays lump sum to dependants when you die</li><li>Rule of thumb: 10–15× annual gross income</li></ul></div><div class="info-card"><h4>💼 Income Protection</h4><ul><li>Replaces 60–85% of your income if you can't work</li><li>Choose "own occupation" and "to age 65" benefit</li></ul></div><div class="info-card"><h4>🏥 Dread Disease / Critical Illness</h4><ul><li>Lump sum on diagnosis of cancer, heart attack, stroke, etc.</li><li>1 in 4 South Africans will be diagnosed with cancer</li></ul></div><div class="info-card"><h4>🏥 Medical Aid</h4><ul><li>Minimum: a <strong>hospital plan</strong> for all working adults</li><li>Council for Medical Schemes: 0861 123 267</li></ul></div>`,
    options: [
      { label: "📝 Estate planning & wills", next: "cfp_estate" },
      { label: "🧾 Tax planning", next: "cfp_tax" },
      { label: "🧩 Back to Financial Planning menu", next: "cfp_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  cfp_estate: {
    message: `📝 <strong>Estate Planning & Wills</strong><div class="info-card"><h4>⚠️ Without a will</h4><ul><li>Estate distributed under <strong>Intestate Succession Act</strong></li><li>Spouse receives R250,000 OR a child's share</li><li>Process can take 2–5 years</li></ul></div><div class="info-card"><h4>📋 Valid will requirements</h4><ul><li>✅ Signed before <strong>2 competent witnesses</strong> (age 14+, not beneficiaries)</li><li>✅ All parties sign <strong>every page</strong></li><li>✅ Witnesses sign in each other's presence</li></ul></div><div class="info-card"><h4>💰 Hidden costs of dying</h4><ul><li><strong>Executor fees:</strong> Up to 3.5% + VAT</li><li><strong>Estate duty:</strong> 20% on first R30m (abatement R3.5m)</li></ul></div><div class="info-card"><h4>🧩 Smart strategies</h4><ul><li>Name beneficiaries directly on life policies and retirement funds</li><li>Spousal rollover exempts estate duty</li><li>Annual R150,000 donations tax exemption</li><li>Review will after every major life event</li></ul></div>`,
    options: [
      { label: "🧾 Tax planning", next: "cfp_tax" },
      { label: "🏁 Retirement planning", next: "cfp_retirement" },
      { label: "🔍 Find a CFP®", next: "cfp_find_planner" },
      { label: "🧩 Back to Financial Planning menu", next: "cfp_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  cfp_tax: {
    message: `🧾 <strong>Tax Planning</strong><div class="info-card"><h4>💡 Your 4 biggest legal tax reduction tools</h4><ul><li>1️⃣ <strong>Retirement contributions:</strong> Deductible up to 27.5% of income (max R350,000/year)</li><li>2️⃣ <strong>TFSA:</strong> R46,000/year — all growth tax-free forever</li><li>3️⃣ <strong>Medical Tax Credits:</strong> R364/month main member + R364 first dependant</li><li>4️⃣ <strong>Section 18A donations:</strong> Deductible up to 10% of taxable income</li></ul></div><div class="info-card"><h4>📈 Capital Gains Tax</h4><ul><li>Inclusion rate: 40% for individuals</li><li>Annual exclusion: R50,000</li><li>Primary residence exclusion: R3 million</li><li>Effective max rate: 18%</li></ul></div><div class="contact-block"><strong>📞 SARS — 0800 00 7277 | www.sars.gov.za</strong></div>`,
    options: [
      { label: "🏁 Retirement planning", next: "cfp_retirement" },
      { label: "📝 Estate planning", next: "cfp_estate" },
      { label: "📈 TFSA / RA details", next: "invest_tfsa_vs_ra" },
      { label: "🧩 Back to Financial Planning menu", next: "cfp_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  cfp_retirement: {
    message: `🏁 <strong>Retirement Planning</strong><br><br>Only about <strong>6% of South Africans retire financially independent</strong>.<div class="info-card"><h4>🎯 What is "enough"?</h4><ul><li>Target: 75–80% of pre-retirement income</li><li><strong>Rule of 25:</strong> Desired annual income × 25 = capital needed</li><li>R1,000/month at 12% from age 25 → ~R3.5 million by 65</li></ul></div><div class="info-card"><h4>🏦 Savings hierarchy</h4><ul><li>1️⃣ Employer pension (take the full match)</li><li>2️⃣ Retirement Annuity (27.5% deduction)</li><li>3️⃣ TFSA (R46,000/year)</li><li>4️⃣ Discretionary investments</li></ul></div><div class="info-card"><h4>🔄 At Retirement — Income Options</h4><ul><li>📊 <strong>Living Annuity:</strong> You control investment, draw 2.5–17.5%/year</li><li>🔒 <strong>Life Annuity:</strong> Guaranteed income for life</li><li>⚖️ <strong>Blended:</strong> Combination — most recommended</li></ul></div>`,
    options: [
      { label: "🏛️ Deep dive on Two-Pot", next: "pension_main" },
      { label: "🧾 Tax planning for retirement", next: "cfp_tax" },
      { label: "📈 Investment products", next: "invest_tfsa_vs_ra" },
      { label: "🔍 Find a CFP®", next: "cfp_find_planner" },
      { label: "🧩 Back to Financial Planning menu", next: "cfp_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  cfp_find_planner: {
    message: `🔍 <strong>How to Find a CFP® Professional</strong><div class="info-card"><h4>✅ How to find one</h4><ul><li>Search the <strong>FPI Member Directory</strong>: www.fpi.co.za</li><li>Verify <strong>FSCA FSP licence</strong>: www.fsca.co.za</li><li>Confirm CFP® designation is active with FPI</li></ul></div><div class="info-card"><h4>❓ Questions to ask</h4><ul><li>"What is your FSCA FSP licence number?"</li><li>"How are you compensated?"</li><li>"Will you complete a full needs analysis?"</li><li>"Will I receive a written Record of Advice?"</li></ul></div><div class="info-card"><h4>🚩 Red flags</h4><ul><li>❌ Recommends a product without a needs analysis</li><li>❌ Can't explain how they are paid</li><li>❌ Pressures you to sign immediately</li><li>❌ Promises specific returns</li></ul></div><div class="contact-block"><strong>📞 FPI — 011 470 6000 | www.fpi.co.za</strong><br>FSCA: 0800 110 443 | www.fsca.co.za</div>`,
    options: [
      { label: "📊 What rights under FAIS?", next: "fais_main" },
      { label: "🧩 Back to Financial Planning menu", next: "cfp_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  ingram_main: {
    message: `💡 <strong>Warren Ingram's Financial Wisdom</strong><br><br>Warren Ingram is one of SA's most respected financial planners — CFP®, co-founder of Galileo Capital, SA's <strong>Financial Planner of the Year 2011</strong>.<br><br><em>"Working with money is actually quite simple. But that doesn't mean it is easy."</em>`,
    options: [
      { label: "🏗️ The 5 steps to financial independence", next: "ingram_5steps" },
      { label: "⭐ 4 hallmarks of financial freedom", next: "ingram_hallmarks" },
      { label: "👩 Sonia's story — R1m by age 30", next: "ingram_sonia" },
      { label: "🏠 The truth about property", next: "ingram_property" },
      { label: "🚗 Financial blunders South Africans make", next: "ingram_blunders" },
      { label: "💑 Money and relationships", next: "ingram_relationships" },
      { label: "↩️ Back to main menu", next: "start" },
    ],
  },

  ingram_5steps: {
    message: `🏗️ <strong>Ingram's 5 Steps to Financial Independence</strong><div class="info-card"><h4>Step 1 — Create a realistic budget</h4><ul><li>Save at least <strong>15% of gross income</strong></li><li>"Pay yourself first" — savings debit order on payday</li></ul></div><div class="info-card"><h4>Step 2 — Eliminate all bad debt</h4><ul><li>Do NOT invest while carrying credit card or store account debt</li><li>Bad debt interest always outpaces investment returns</li></ul></div><div class="info-card"><h4>Step 3 — Build your cash safety net</h4><ul><li>At least <strong>half your annual expenses</strong> in a money market</li></ul></div><div class="info-card"><h4>Step 4 — Eradicate remaining debt</h4><ul><li>Home loan is last (builds an asset)</li></ul></div><div class="info-card"><h4>Step 5 — Build your investment portfolio</h4><ul><li>Only once steps 1–4 are in place</li></ul></div>`,
    options: [
      { label: "⭐ What does financial freedom look like?", next: "ingram_hallmarks" },
      { label: "👩 Sonia's story", next: "ingram_sonia" },
      { label: "💰 Build my budget (CFP module)", next: "cfp_cashflow" },
      { label: "💡 Back to Ingram's Wisdom", next: "ingram_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  ingram_hallmarks: {
    message: `⭐ <strong>4 Hallmarks of Financial Independence</strong><div class="info-card"><h4>✅ 1 — Free of bad debt</h4><ul><li>No credit cards, store accounts, or personal loans</li></ul></div><div class="info-card"><h4>✅ 2 — Emergency fund in place</h4><ul><li>At least <strong>half your annual expenses</strong> saved</li></ul></div><div class="info-card"><h4>✅ 3 — Spend less than you earn, consistently</h4><ul><li>Every single month — visible wealth ≠ real wealth</li></ul></div><div class="info-card"><h4>✅ 4 — Income-generating assets cover future expenses</h4><ul><li>The "Rule of 25" — save 25× annual expenses</li></ul></div><div class="info-card" style="background:#f0fdf4;border-left:4px solid #22c55e;"><em>"Financial freedom is not the same as wealth. Some people are financially free with R5 million, while others have R50 million and are still enslaved by their expenses."</em><br>— Warren Ingram</div>`,
    options: [
      { label: "🏗️ The 5-step path", next: "ingram_5steps" },
      { label: "👩 Sonia's story", next: "ingram_sonia" },
      { label: "💡 Back to Ingram's Wisdom", next: "ingram_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  ingram_sonia: {
    message: `👩 <strong>"Sonia" — R1.2 Million by Age 30</strong><div class="info-card"><h4>📋 Starting position (age 26)</h4><ul><li>Take-home: <strong>R14,000/month</strong></li><li>Saved: <strong>R9,000/month</strong> — 64% savings rate</li><li>Invested only in <strong>ETFs</strong> (Satrix 40)</li></ul></div><div class="info-card"><h4>🚀 4 years later (age 30)</h4><ul><li>Portfolio: <strong>R1.2 million</strong></li><li>Investing: <strong>R20,000/month</strong> (salary had doubled)</li><li>Same flat. Same car.</li></ul></div><div class="info-card"><h4>💡 What made the difference</h4><ul><li>🎯 Bought index ETFs — anyone can do this</li><li>🎯 Invested consistently every month</li><li>🎯 Kept lifestyle flat as income grew</li><li>🎯 Treated herself to holidays — sustainable discipline</li></ul></div><div class="info-card"><h4>🔑 Apply today</h4><ul><li>Open a TFSA and buy a low-cost ETF — R500/month to start</li><li>Automate on payday</li><li>When salary increases: <strong>invest the raise</strong>, don't spend it</li></ul></div>`,
    options: [
      { label: "📈 How ETFs and TFSA work", next: "invest_products" },
      { label: "🏗️ The 5-step plan", next: "ingram_5steps" },
      { label: "🚗 Mistakes to avoid", next: "ingram_blunders" },
      { label: "💡 Back to Ingram's Wisdom", next: "ingram_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  ingram_property: {
    message: `🏠 <strong>The Truth About Residential Property</strong><div class="info-card"><h4>📊 Long-term SA returns (real, after inflation 1900–2012)</h4><ul><li>📈 Shares: <strong>7.5%</strong> per year</li><li>🏢 Listed property: <strong>6.4%</strong></li><li>📜 Bonds: <strong>2.0%</strong></li><li>🏠 Residential property: <strong>1.9%</strong></li><li>💵 Cash: <strong>1.0%</strong></li></ul>Residential property ranked <strong>4th out of 5</strong> asset classes.</div><div class="info-card"><h4>💸 Hidden costs of home ownership</h4><ul><li>Transfer duty + legal fees: 2.5–8%</li><li>Agent commission on sale: 3–7%</li><li>Annual maintenance: ~1.5% of value</li></ul></div><div class="info-card"><h4>💡 Ingram's position</h4><ul><li>✅ Buy a home for stability if affordable</li><li>❌ Don't call your home an "investment"</li><li>❌ Don't over-extend on the biggest house possible</li></ul></div>`,
    options: [
      { label: "📈 Where to invest instead?", next: "invest_asset_classes" },
      { label: "🚗 Financial blunders", next: "ingram_blunders" },
      { label: "💡 Back to Ingram's Wisdom", next: "ingram_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  ingram_blunders: {
    message: `🚗 <strong>Financial Blunders South Africans Make</strong><div class="info-card"><h4>1. The Car Trap 🚙</h4><ul><li>A R600,000 car financed over 7 years costs R900,000+ total</li><li><em>"If we all spent less on cars, our country would have many more homeowners."</em></li></ul></div><div class="info-card"><h4>2. Chasing Tax Savings with Bad Investments</h4><ul><li>Tank containers, aeroplane syndicates — most lose money even after tax saving</li><li>Use your RA and TFSA instead</li></ul></div><div class="info-card"><h4>3. Investing Before Clearing Bad Debt</h4><ul><li>A store card at 30% destroys any 12% investment return</li></ul></div><div class="info-card"><h4>4. The "Visible Wealth" Trap</h4><ul><li>Real wealth is quiet — it shows in your net worth, not on Instagram</li></ul></div><div class="info-card"><h4>5. Leaving a Partner in the Dark</h4><ul><li>Both partners must know the full financial picture</li></ul></div>`,
    options: [
      { label: "🏗️ The right path forward", next: "ingram_5steps" },
      { label: "💑 Money and relationships", next: "ingram_relationships" },
      { label: "💡 Back to Ingram's Wisdom", next: "ingram_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

  ingram_relationships: {
    message: `💑 <strong>Money and Relationships</strong><div class="info-card"><h4>🤝 Core principle</h4><ul><li>Both partners must be <strong>fully informed</strong> about finances</li><li>Not about control — about mutual protection</li></ul></div><div class="info-card"><h4>⚠️ Common patterns in struggling couples</h4><ul><li>One partner hides spending</li><li>One partner manages everything while the other is uninvolved</li><li>Entrepreneur mortgages family home without telling spouse</li></ul></div><div class="info-card"><h4>💡 What to do instead</h4><ul><li>✅ Have a money conversation at least quarterly</li><li>✅ Agree on long-term strategy together</li><li>✅ Assign roles by strength — share information</li><li>✅ Both should know where everything is</li><li>✅ Review beneficiary nominations annually</li></ul></div>`,
    options: [
      { label: "📝 Estate planning for protection", next: "cfp_estate" },
      { label: "🛡️ Insurance for income protection", next: "cfp_protection" },
      { label: "🚗 Common blunders", next: "ingram_blunders" },
      { label: "💡 Back to Ingram's Wisdom", next: "ingram_main" },
      { label: "🔄 Start over", next: "start" },
    ],
  },

};
