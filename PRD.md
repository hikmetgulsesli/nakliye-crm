# Product Requirements Document (PRD)

## International Shipping CRM

**Version:** 3.0  
**Date:** March 1, 2026  
**Project Owner:** Hakan Gülsesli  
**Repository:** ~/projects/nakliye-crm  
**Database:** PostgreSQL (external: host=72.61.186.46, port=37550)

---

## 1. Project Overview

### 1.1 Project Summary

A web-based CRM application tailored for international shipping operations. The application is designed to be **simple, clean, and fast**, enabling the sales team to efficiently manage customers and quotations.

### 1.2 Core Objectives

- Simplify customer and quote tracking for the sales team
- Enable status monitoring through dashboards
- Allow authorized personnel to export reports (PDF/Excel)
- Prevent customer data duplication
- Measure team performance transparently

### 1.3 Target Platform

- **Platform:** Web Application (Responsive - Desktop First)
- **Target Users:** Sales representatives (5 users), Administrators
- **Browser Support:** Chrome, Firefox, Safari, Edge (latest 2 versions)

### 1.4 Key Design Decisions

✅ All users can view all customers (critical for duplicate prevention)  
✅ Everyone can create and update quotations  
✅ The user who makes an update is recorded as the transaction owner in logs  
✅ Dynamic field management (list values can be changed without code changes)  
✅ Admin can perform representative transfer operations  

---

## 2. Technical Stack Recommendation

### 2.1 Frontend

| Technology | Purpose |
|------------|---------|
| **Next.js 14+** (App Router) | React framework with server-side rendering |
| **Tailwind CSS + shadcn/ui** | UI components and styling |
| **Zustand** | Lightweight state management |
| **React Hook Form + Zod** | Form handling and validation |

### 2.2 Backend

| Option | Description |
|--------|-------------|
| **Supabase** (Recommended) | BaaS - auth + database + realtime |
| **Node.js + Express + PostgreSQL** | Custom backend alternative |

### 2.3 Database

- **PostgreSQL** - Relational structure with foreign key support
- **pg_trgm extension** - Full-text search with fuzzy matching

### 2.4 Authentication

- **Supabase Auth** or **NextAuth.js**
- Role-based access control (RBAC)

### 2.5 Deployment

| Component | Recommendation |
|-----------|----------------|
| Frontend | Vercel or Netlify |
| Backend | Supabase or Railway/Render |
| Database | Supabase PostgreSQL or Neon |

---

## 3. User Roles and Permission Matrix

### 3.1 Roles

| Role | Description |
|------|-------------|
| **Admin** | Administrators with full system access |
| **User** | Sales representatives (5 team members) |

### 3.2 Permission Matrix

| Feature | Admin | User |
|---------|-------|------|
| View all customers | ✅ | ✅ |
| Add/Update customers | ✅ | ✅ |
| Create/Update quotations | ✅ | ✅ |
| Log activities | ✅ | ✅ |
| View personal dashboard | ✅ | ✅ |
| **View all team dashboards** | ✅ | ❌ |
| **Export reports (PDF/Excel)** | ✅ | ❌ |
| **Delete records** | ✅ | ❌ |
| **Edit/Delete others' records** | ✅ | ❌ |
| **User management** | ✅ | ❌ |
| **System settings (dynamic lists)** | ✅ | ❌ |
| **Representative transfer** | ✅ | ❌ |
| **View audit logs** | ✅ | ❌ |

---

## 4. Modules and Features

### Module 1: Customer Card and Duplicate Prevention

#### 4.1.1 Basic Information

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Company Name | Text | Yes | Checked for duplicates |
| Contact Name | Text | No | Primary contact person |
| Phone | Text | Yes | Checked for duplicates |
| Email | Email | Yes | Checked for duplicates (case-insensitive) |
| Address | Text | No | Company address |

#### 4.1.2 Shipping Preferences

| Field | Type | Description |
|-------|------|-------------|
| Transport Mode | Multi-select Dropdown | Sea / Air / Road / Combined |
| Service Type | Multi-select Dropdown | FCL / LCL / Part loads / Full / Bulk / RoRo |
| Sales Method (Incoterm) | Multi-select Dropdown | FOB / EXW / FCA / DAP / CIF / CFR / DDP |
| Direction | Checkbox | Import / Export (both can be selected) |

#### 4.1.3 Location Information

| Field | Type | Description |
|-------|------|-------------|
| Origin Countries | Multi-select | Countries where customer picks up cargo |
| Destination Countries | Multi-select | Countries where customer delivers cargo |

#### 4.1.4 CRM Information

| Field | Type | Description |
|-------|------|-------------|
| Source | Dropdown | Referral / Cold Call / Fair / Digital |
| Potential | Dropdown | Low / Medium / High |
| Customer Status | Dropdown | Active / Passive / Cold |
| Assigned Representative | Dropdown | Responsible sales representative |
| Last Contact Date | Date | Auto-filled from activity records |
| Last Quote Date | Date | Auto-filled from quote records |
| Description / Note | Textarea | Free-form notes |

#### 4.1.5 Duplicate Prevention System (CRITICAL)

**Controlled Fields:**
1. **Company Name** - Fuzzy match (80%+ similarity shows warning)
2. **Phone Number** - Exact match
3. **Email Address** - Exact match (case-insensitive)

**Workflow:**

**Step 1: Real-time Control**
- As user types company name, system displays similar existing records
- Google-style search suggestions shown

**Step 2: Form Validation**
- When phone or email is entered, duplicate check is performed
- If match found, **yellow warning banner** displayed:
  > ⚠️ This phone number is already used in another record

**Step 3: Submit Control**
- Final check performed when save button is clicked
- If duplicate detected, **modal opens**:

```
🔴 This Customer May Already Be Registered

Similar records found in system:

┌─────────────────────────────────────────────────┐
│ ABC Lojistik Ltd.                               │
│ Assigned: Ahmet Yılmaz                         │
│ Last Contact: 15.02.2026                       │
│ [Open Record]                                  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ ABC Logistics                                   │
│ Assigned: Mehmet Kaya                          │
│ Last Contact: 20.01.2026                       │
│ [Open Record]                                  │
└─────────────────────────────────────────────────┘

[❌ Cancel]  [⚠️ Save Anyway (Admin Approval)]
```

**Permission Rules:**
- **User:** Cannot create new record if duplicate exists, can open existing record
- **Admin:** Can force-create with "Save Anyway" option
- Every forced save is marked in audit log

---

### Module 2: Quotation Management

#### 4.2.1 Quotation Information

| Field | Type | Description |
|-------|------|-------------|
| Quotation No | Auto-generated | Format: TKF-2026-0001 |
| Linked Customer | Dropdown (searchable) | Selected from customer cards |
| Quotation Date | Date | Default: today |
| Validity Date | Date | Last valid date of quotation |

#### 4.2.2 Cargo Movement Information (Shipping Terminology)

| Field | Type | Description |
|-------|------|-------------|
| Transport Mode | Dropdown | Sea / Air / Road / Combined |
| Service Type | Dropdown | FCL / LCL / Part loads / Full / Bulk / RoRo |
| Origin Country | Dropdown | Country where cargo is picked up |
| Loading Point (POL) | Dropdown/Text | Port of Loading - port or city |
| Destination Country | Dropdown | Country where cargo is delivered |
| Delivery Point (POD) | Dropdown/Text | Port of Discharge - port or city |
| Sales Method (Incoterm) | Dropdown | FOB / EXW / FCA / DAP / CIF / CFR / DDP |

#### 4.2.3 Pricing Information

| Field | Type | Description |
|-------|------|-------------|
| Price | Number | Quotation amount |
| Currency | Dropdown | USD / EUR / TRY |
| Price Note | Textarea | Optional description |

#### 4.2.4 Quotation Status

| Field | Type | Description |
|-------|------|-------------|
| Result | Dropdown | Pending / Won / Lost |
| Loss Reason | Dropdown | Price / Competitor / Delayed Response / Other (shown only when "Lost" is selected) |
| Assigned Representative | Dropdown | Person who prepared the quotation |
| Revision Count | Auto-calculated | Number of times updated |

#### 4.2.5 Revision History

Each quotation update creates automatic log:

| Revision No | Date | Updated By | Change |
|-------------|------|------------|--------|
| Rev-1 | 15.02.2026 | Ahmet Y. | Price: $2000 → $1850 |
| Rev-2 | 20.02.2026 | Ahmet Y. | POD: Istanbul → Izmir |

---

### Module 3: Activity and Meeting Tracking

All communication with customers is logged.

#### 4.3.1 Activity Information

| Field | Type | Description |
|-------|------|-------------|
| Linked Customer | Dropdown | Which customer was contacted |
| Activity Type | Dropdown | Phone / Email / In-Person / Video Call |
| Date and Time | DateTime | Meeting time |
| Duration (minutes) | Number | Optional |
| Meeting Note | Textarea | What was discussed |
| Result | Dropdown | Positive / Neutral / Negative / Quote Requested |
| Next Action Date | Date | For follow-up planning |
| Recorded By | Auto-fill | Logged-in user |

#### 4.3.2 Auto-Update
- When activity is recorded, **"Last Contact Date"** on customer card is auto-updated
- When quotation is created, **"Last Quote Date"** is auto-updated

---

### Module 4: Reminder and Alert System

System automatically creates follow-up lists.

#### 4.4.1 Auto Lists

| List | Criteria | Display |
|------|----------|---------|
| 🔴 **Customers Not Called** | No activity for 14 days | Dashboard widget + notification |
| 🟡 **Pending Quotes** | 7+ days without response | Dashboard widget |
| 🟠 **Expired Quotes** | Validity date passed, status "Pending" | Dashboard widget |
| 🟢 **High Potential** | Potential=High + no quote for 30 days | Dashboard widget |

#### 4.4.2 Notification System

**Dashboard Widget**
- Number badge for each list
- Clicking opens filtered customer/quotation list

**Email Notification (Optional)**
- Can be enabled by admin in settings
- Daily summary email (09:00 AM)
- Critical alerts sent immediately

---

### Module 5: Dashboard System

Special dashboard views for each role.

#### 4.5.1 User Dashboard

Screen shown when sales representative logs in.

**Personal Metrics**

| Metric | Description |
|--------|-------------|
| Quotes Given This Week | Count |
| Quotes Given This Month | Count |
| Quotes Won This Month | Count + win rate % |
| Customers Contacted This Month | Count |

**Widgets**

1. **Upcoming Follow-ups**
   - Activities planned for today or next 3 days
   - Clicking opens customer card

2. **Customers to Call (🔴)**
   - Customers assigned to user with no contact for 14 days

3. **Pending Quotes (🟡)**
   - Quotes created by user with no response for 7+ days

4. **Recent Activities**
   - Last 10 activity records (from all users - for transparency)

#### 4.5.2 Admin Dashboard

Screen shown when administrator logs in.

**General Metrics**

| Metric | Time Period |
|--------|-------------|
| Quotes Given Count | This week / This month / Last month |
| Quotes Won Count | This week / This month / Last month |
| Win Rate (%) | This month (Won / Given) |
| Active Customer Count | Total |
| High Potential Customer | Total |

**Personnel Performance Table**

| Representative | Quotes Given | Won | Win % | Customers Contacted |
|---------------|-------------|-----|-------|---------------------|
| Ahmet Y. | 15 | 8 | 53% | 32 |
| Mehmet K. | 12 | 5 | 42% | 28 |
| Ayşe D. | 18 | 10 | 56% | 40 |
| Fatma S. | 10 | 4 | 40% | 22 |
| Ali T. | 14 | 7 | 50% | 30 |

**Origin Country Intensity**

**Top 5 Origin Countries**
| Country | Quotes Given |
|---------|--------------|
| China | 35 |
| Germany | 22 |
| Italy | 18 |
| USA | 15 |
| UK | 12 |

**Top 5 Destination Countries**
| Country | Quotes Given |
|---------|--------------|
| Turkey | 68 |
| UK | 12 |
| France | 8 |
| Spain | 6 |
| Netherlands | 4 |

**Mode Distribution**

| Transport Mode | Quotes Given | Win % |
|----------------|--------------|-------|
| Sea | 45 | 52% |
| Air | 28 | 48% |
| Road | 15 | 60% |
| Combined | 8 | 50% |

**Loss Reason Analysis**

| Reason | Count | Rate |
|--------|-------|------|
| Price | 12 | 48% |
| Competitor | 8 | 32% |
| Delayed Response | 3 | 12% |
| Other | 2 | 8% |

#### 4.5.3 Filtering System

Filters applicable to all lists and dashboard screens:

| Filter | Values |
|--------|--------|
| Date Range | Start - End |
| Origin Country | Multi-select |
| Destination Country | Multi-select |
| Transport Mode | Sea / Air / Road / Combined |
| Service Type | FCL / LCL / Part loads / Full / Bulk |
| Assigned Representative | User list |
| Potential | Low / Medium / High |
| Customer Status | Active / Passive / Cold |
| Currency | USD / EUR / TRY |
| Sales Method | FOB / EXW / FCA / DAP / CIF etc. |

---

### Module 6: Reports and Export

**Admin only.**

#### 4.6.1 Report Types

**1️⃣ Periodic Quotation Report**
- Date range selection
- All quotations or filtered
- Export: PDF + Excel

**Content:**
- Quotation list (detailed)
- Win rates
- Total quotation value (by currency)

**2️⃣ Personnel Performance Report**
- Selected period performance for each representative
- Export: PDF + Excel

**Content:**
- Quote count, win rate
- Customers contacted
- Average quote value
- Loss reason distribution

**3️⃣ Won/Lost Quotation Analysis**
- Period selection
- Detailed analysis of won and lost quotations
- Export: PDF + Excel

**Content:**
- Won quotations list
- Lost quotations + reasons
- Breakdown by country, mode, representative

**4️⃣ Country/Mode Based Volume Report**
- Which countries/modes have intensity
- Export: PDF + Excel

**Content:**
- Origin-destination country combinations
- Quote count and total value by mode
- Trend chart (monthly)

**5️⃣ Loss Reason Analysis**
- Why are we losing to competitors?
- Export: PDF + Excel

**Content:**
- Loss reason distribution (chart)
- Detailed list by reason
- Recommendation notes (admin can add)

---

### Module 7: Dynamic Field Management

**Admin Panel** → System Settings → **List Management**

Manage list values without code changes.

#### 4.7.1 Manageable Lists

| List Name | Example Values |
|-----------|----------------|
| Transport Mode | Sea, Air, Road, Combined, Multimodal |
| Service Type | FCL, LCL, Part loads, Full, Bulk, RoRo, Break Bulk |
| Sales Method (Incoterm) | FOB, EXW, FCA, DAP, CIF, CFR, DDP, DDU |
| Customer Source | Referral, Cold Call, Fair, Digital, LinkedIn, Existing Customer Referral |
| Customer Status | Active, Passive, Cold, Potential |
| Potential Level | Low, Medium, High, A+ (Strategic) |
| Quotation Result Status | Pending, Won, Lost, Cancelled |
| Loss Reason | Price, Competitor, Delayed Response, Budget, Other |
| Currency | USD, EUR, TRY, GBP, CNY |
| Port / Point | Shanghai, Shenzhen, Hamburg, Rotterdam, Istanbul-Ambarlı, Izmir etc. |
| Country | Turkey, China, Germany, Italy, USA, UK etc. |

#### 4.7.2 Management Operations

**➕ Add New Value**
- Enter value name
- Sort order (optional)
- Save

**✏️ Edit Existing Value**
- Change value name
- **Warning shown:**
  > ⚠️ This change will affect 45 existing records. Do you want to continue?
- Confirm → all records updated

**🔴 Deactivate**
- Value **not deleted**, just deactivated
- Still visible in old records
- Not shown in new record dropdowns
- **Badge:** 🔴 Inactive

**🔃 Reordering**
- Drag & drop to change dropdown order
- Frequently used items can be brought to top

#### 4.7.3 Technical Implementation
- All dynamic lists stored in single `lookup_values` table
- Each value has: `category` (list name), `value`, `is_active`, `sort_order`
- Dropdowns show only `is_active = true` values
- Inactive values still readable in reports

---

### Module 8: Representative Assignment and Transfer

#### 4.8.1 Individual Assignment Change

- Admin opens any customer card
- Changes **"Assigned Representative"** dropdown
- Saves

**Log Record:**
```
Representative updated: Ahmet Yılmaz → Mehmet Kaya
Updated by: Admin | 01.03.2026 02:30
```

#### 4.8.2 Bulk Transfer Operation

**Scenario:** A representative left the company, all customers need to be transferred to someone else.

**Operation Steps**

**1. Admin Panel → User Management → Representative Transfer**

**2. Transfer Form**
```
┌────────────────────────────────────────┐
│ Transferring Representative: [Ahmet Y. ▾] │
│ Receiving Representative:   [Mehmet K. ▾] │
│                                        │
│ Which Records to Transfer?              │
│ ○ All records                          │
│ ○ Only active customers                │
│ ○ Only open quotations                 │
│                                        │
│ [Preview]                              │
└────────────────────────────────────────┘
```

**3. Preview Screen**
```
Ahmet Yılmaz → Mehmet Kaya transfer

Affected Records:
- 32 customers
- 18 open quotations
- 45 activity records (only assigned changes)

[❌ Cancel]  [✅ Confirm Transfer]
```

**4. After Confirmation**
- Bulk update performed (in transaction)
- Single bulk log record created:
  ```
  Bulk representative transfer performed
  Ahmet Yılmaz → Mehmet Kaya
  32 customers, 18 quotations transferred
  Performed by: Admin | 01.03.2026 02:35
  ```

**5. Old Representative Deactivated**
- User account **not deleted**, just deactivated
- Name still visible in historical records
- Cannot log in
- Logs preserved

---

### Module 9: Log and Audit System

Every change is recorded.

#### 4.9.1 Log Scope

| Operation | Recorded Information |
|-----------|----------------------|
| Customer creation | Who, when, which fields |
| Customer update | Who, when, which field changed (old → new) |
| Quotation creation | Who, when |
| Quotation update | Who, when, which field changed |
| Activity record | Who, when |
| Representative change | Who, when, old → new |
| Record deletion | Who, when, which record |
| Forced duplicate save | Who, when, which fields duplicated |

#### 4.9.2 Log View

**On Customer Detail Page — "History" Tab**

```
┌──────────────────────────────────────────────────────────┐
│ 01.03.2026 02:10  |  Ahmet Y.  |  Record created        │
├──────────────────────────────────────────────────────────┤
│ 01.03.2026 14:22  |  Mehmet K. |  Field updated        │
│                   Potential: Medium → High              │
├──────────────────────────────────────────────────────────┤
│ 02.03.2026 09:05  |  Admin     |  Representative changed│
│                   Ahmet Y. → Mehmet K.                   │
├──────────────────────────────────────────────────────────┤
│ 02.03.2026 11:30  |  Mehmet K. |  Quotation created   │
│                   TKF-2026-0042                          │
└──────────────────────────────────────────────────────────┘
```

**Admin Panel — System Log View**

- View all logs
- Filter: User / Operation type / Date range
- Export: CSV

#### 4.9.3 Technical Detail

**Field-level diff** is recorded:
```json
{
  "user_id": 5,
  "record_type": "customer",
  "record_id": 123,
  "action": "update",
  "changes": {
    "potential": {
      "old": "Medium",
      "new": "High"
    }
  },
  "timestamp": "2026-03-01T14:22:00Z"
}
```

---

## 5. Security Requirements

### 5.1 Authentication

- ✅ Email + password login
- ✅ Password policy: Min 8 characters, at least 1 special character
- ✅ Session duration: 8-hour automatic logout
- ✅ "Remember me" option (30 days)

### 5.2 Admin Security

- ✅ 2FA mandatory (for Admin accounts)
- ✅ IP restriction (optional)

### 5.3 Data Security

- ✅ Passwords hashed (bcrypt)
- ✅ HTTPS mandatory
- ✅ SQL injection protection (prepared statements)
- ✅ XSS protection

### 5.4 Permission Controls

- ✅ Role check on every API endpoint
- ✅ Users can only delete their own activities
- ✅ Admin can delete/edit any record
- ✅ Deletions reversible (soft delete)

### 5.5 Log Security

- ✅ Logs cannot be deleted or edited
- ✅ Only Admin can view logs

---

## 6. Database Schema Recommendations

### 6.1 Core Tables

#### users
| Column | Type | Description |
|--------|------|-------------|
| id | PK | Primary key |
| email | String | Unique email |
| password_hash | String | Hashed password |
| full_name | String | User's full name |
| role | Enum | admin / user |
| is_active | Boolean | Account status |
| created_at | Timestamp | Creation date |
| updated_at | Timestamp | Last update |

#### customers
| Column | Type | Description |
|--------|------|-------------|
| id | PK | Primary key |
| company_name | String | Company name |
| contact_name | String | Contact person |
| phone | String | Phone number |
| email | String | Email address |
| address | String | Company address |
| transport_modes | JSON Array | Transport mode selections |
| service_types | JSON Array | Service type selections |
| incoterms | JSON Array | Incoterm selections |
| direction | String | import / export / both |
| origin_countries | JSON Array | Origin country selections |
| destination_countries | JSON Array | Destination country selections |
| source | FK → lookup_values | Customer source |
| potential | FK → lookup_values | Potential level |
| status | FK → lookup_values | Customer status |
| assigned_user_id | FK → users | Assigned representative |
| last_contact_date | Date | Last contact (auto) |
| last_quote_date | Date | Last quote (auto) |
| notes | Text | Free-form notes |
| created_by | FK → users | Creator user |
| created_at | Timestamp | Creation date |
| updated_at | Timestamp | Last update |

#### quotations
| Column | Type | Description |
|--------|------|-------------|
| id | PK | Primary key |
| quote_no | String | Unique quote number |
| customer_id | FK → customers | Linked customer |
| quote_date | Date | Quote date |
| validity_date | Date | Validity end date |
| transport_mode | FK → lookup_values | Transport mode |
| service_type | FK → lookup_values | Service type |
| origin_country | FK → lookup_values | Origin country |
| pol | String | Port of Loading |
| destination_country | FK → lookup_values | Destination country |
| pod | String | Port of Discharge |
| incoterm | FK → lookup_values | Incoterm |
| price | Decimal | Quote price |
| currency | FK → lookup_values | Currency |
| price_note | Text | Price notes |
| status | FK → lookup_values | Quote result |
| loss_reason | FK → lookup_values | Loss reason (nullable) |
| assigned_user_id | FK → users | Assigned representative |
| revision_count | Integer | Revision count |
| created_by | FK → users | Creator user |
| created_at | Timestamp | Creation date |
| updated_at | Timestamp | Last update |

#### quotation_revisions
| Column | Type | Description |
|--------|------|-------------|
| id | PK | Primary key |
| quotation_id | FK → quotations | Parent quotation |
| revision_no | Integer | Revision number |
| changed_fields | JSON | Field changes {old, new} |
| revised_by | FK → users | Who revised |
| revised_at | Timestamp | Revision timestamp |

#### activities
| Column | Type | Description |
|--------|------|-------------|
| id | PK | Primary key |
| customer_id | FK → customers | Linked customer |
| activity_type | FK → lookup_values | Activity type |
| activity_date | DateTime | Activity timestamp |
| duration_minutes | Integer | Duration |
| notes | Text | Meeting notes |
| outcome | FK → lookup_values | Result |
| next_action_date | Date | Next follow-up date |
| created_by | FK → users | Creator user |
| created_at | Timestamp | Creation date |

#### lookup_values
| Column | Type | Description |
|--------|------|-------------|
| id | PK | Primary key |
| category | String | List category name |
| value | String | Display value |
| is_active | Boolean | Active status |
| sort_order | Integer | Display order |
| created_at | Timestamp | Creation date |
| updated_at | Timestamp | Last update |

#### audit_log
| Column | Type | Description |
|--------|------|-------------|
| id | PK | Primary key |
| user_id | FK → users | Performing user |
| record_type | String | Record type (customer/quotation/activity) |
| record_id | Integer | Record ID |
| action | String | create/update/delete/transfer |
| changes | JSON | Field-level diff |
| timestamp | Timestamp | Operation timestamp |

---

## 7. Screen List (For Designer Reference)

### 7.1 Authentication Screens
1. **Login Page** - Email/password login
2. **Registration Page** - New user registration (admin only)

### 7.2 Customer Screens
3. **Customer List Page** - Table view with filters
4. **Customer Create/Edit Page** - Form with duplicate prevention
5. **Customer Detail Page** - Full customer info with tabs (Overview, Quotations, Activities, History)

### 7.3 Quotation Screens
6. **Quotation List Page** - Table view with filters
7. **Quotation Create/Edit Page** - Form with all quote fields
8. **Quotation Detail Page** - Full quote info with revision history

### 7.4 Activity Screens
9. **Activity Create Modal** - Quick activity entry (from customer detail)
10. **Activity List** - Embedded in customer detail

### 7.5 Dashboard Screens
11. **User Dashboard** - Personal metrics and widgets
12. **Admin Dashboard** - Team metrics, performance tables, charts

### 7.6 Report Screens
13. **Report Selection Page** - Choose report type
14. **Report Preview Page** - View report with export buttons
15. **Export Modal** - PDF/Excel download

### 7.7 Admin Screens
16. **User Management Page** - List users, add/edit/deactivate
17. **Representative Transfer Page** - Bulk transfer interface
18. **Dynamic List Management Page** - CRUD for lookup values
19. **Audit Log View Page** - View and filter logs
20. **System Settings Page** - Email settings, 2FA, IP restrictions

### 7.8 Common Components
- **Navigation Sidebar** - Role-based menu
- **Top Header** - User info, notifications, logout
- **Filter Panel** - Reusable across all list pages
- **Search Bar** - Global search
- **Notification Bell** - Alert list

---

## 8. MVP Development Roadmap

### Sprint 1: Basic Infrastructure (2 weeks)

**Goal:** Users can log in, add customers.

**Backend:**
- [ ] Create database schema (PostgreSQL)
- [ ] Set up auth system (Supabase Auth or NextAuth.js)
- [ ] Role-based middleware
- [ ] User CRUD API
- [ ] Customer CRUD API

**Frontend:**
- [ ] Login/Register page
- [ ] Layout and navigation
- [ ] Customer list page
- [ ] Customer add form
- [ ] Customer detail page

**Features:**
- ✅ User login
- ✅ Customer add, list, view
- ✅ Basic permission control (Admin/User)

---

### Sprint 2: Duplicate Prevention + Dynamic Lists (2 weeks)

**Goal:** Customer duplication prevented, list values managed dynamically.

**Backend:**
- [ ] Fuzzy search endpoint (customer name similarity)
- [ ] Phone/email match check
- [ ] `lookup_values` table and API
- [ ] List management CRUD (Admin only)

**Frontend:**
- [ ] Real-time duplicate check in customer form
- [ ] Duplicate warning modal
- [ ] Admin panel: List management screen
- [ ] Dynamic dropdowns (all forms)

**Features:**
- ✅ Customer duplicate prevention system
- ✅ Dynamic list management (Admin)
- ✅ Dropdowns now dynamic

---

### Sprint 3: Quotation Module (2 weeks)

**Goal:** Quotations can be created and revised.

**Backend:**
- [ ] Quotation CRUD API
- [ ] Auto quote number generation
- [ ] Revision history system
- [ ] Auto-update last quote date on customer card

**Frontend:**
- [ ] Quotation list page
- [ ] Quotation add form
- [ ] Quotation detail page
- [ ] Revision history view
- [ ] Quotations tab in customer detail

**Features:**
- ✅ Quotation creation
- ✅ Quotation revision
- ✅ Revision history
- ✅ POL/POD system

---

### Sprint 4: Log System + Representative Transfer (1 week)

**Goal:** Every change is logged, representative transfer works.

**Backend:**
- [ ] `audit_log` table
- [ ] Field-level diff logging
- [ ] Log API (Admin only)
- [ ] Bulk representative transfer API

**Frontend:**
- [ ] Customer detail "History" tab
- [ ] Admin panel: Log view
- [ ] Admin panel: Representative transfer screen

**Features:**
- ✅ All changes logged
- ✅ Representative transfer operation

---

### Sprint 5: Activity Tracking + Reminders (1 week)

**Goal:** Meetings are recorded, automatic reminders generated.

**Backend:**
- [ ] Activity CRUD API
- [ ] Auto-update last contact date on customer card
- [ ] Reminder queries (14-day warning, etc.)

**Frontend:**
- [ ] Activity add modal (in customer detail)
- [ ] Activity list (in customer detail)
- [ ] Dashboard widgets (🔴 🟡 🟠 🟢)

**Features:**
- ✅ Activity logging
- ✅ Reminder lists

---

### Sprint 6: Dashboard (2 weeks)

**Goal:** User and Admin dashboards work.

**Backend:**
- [ ] Dashboard metric APIs
- [ ] Personnel performance query
- [ ] Country/mode intensity query
- [ ] Loss reason analysis query

**Frontend:**
- [ ] User dashboard (personal metrics + widgets)
- [ ] Admin dashboard (general metrics + tables + charts)
- [ ] Filtering system (all screens)

**Features:**
- ✅ User dashboard
- ✅ Admin dashboard
- ✅ Filtering

---

### Sprint 7: Reports + Export (1 week)

**Goal:** Reports can be exported as PDF and Excel.

**Backend:**
- [ ] Report queries (5 types)
- [ ] PDF export library integration
- [ ] Excel export library integration

**Frontend:**
- [ ] Report selection screen
- [ ] Report preview
- [ ] Export buttons

**Features:**
- ✅ 5 report types
- ✅ PDF + Excel export

---

### Sprint 8: Email Notifications + Final Touches (1 week)

**Goal:** System fully functional, ready for production.

**Backend:**
- [ ] Email sending service (e.g., SendGrid, Resend)
- [ ] Daily summary email job
- [ ] Critical alert emails

**Frontend:**
- [ ] Email settings (Admin panel)
- [ ] User notifications (bell icon)

**Test & Deploy:**
- [ ] Full module integration testing
- [ ] Performance testing (with sample data)
- [ ] Production deployment
- [ ] SSL certificate
- [ ] Backup strategy

**Features:**
- ✅ Email notifications
- ✅ System live

---

**Total Duration: 12 weeks (3 months)**

---

## 9. Phase 2: AI Features

To be added after MVP completion.

### 9.1 Win Probability Prediction 🤖

**How it works:**
- Machine learning model trained on historical quote data
- Parameters: Customer potential, quote value, country, mode, representative history, revision count
- **Win probability %** shown for each quotation

**Usage:**
- On quotation detail:
  > 🤖 Win Probability: %68 (High)
- Priority sorting: High-probability quotations come first

---

### 9.2 Automatic Quote Email Draft ✉️

**How it works:**
- Quote information sent to AI
- Professional email draft created with GPT-4
- Turkish / English option

**Usage:**
- "Create Email" button on quotation detail
- AI generates draft
- User edits and sends

**Example Output:**
```
Dear [Contact Name],

Please find attached our [POL - POD] route 
[Service Type] transport quotation for [Company Name].

Price: $[Price] ([Incoterm])
Validity: [Date]

...
```

---

### 9.3 Customer Churn Risk Warning 📉

**How it works:**
- Customer activity history analyzed
- Abnormal decline detected:
  - No calls for long time
  - Quote count decreased
  - Recent quotes lost
- Automatic warning generated

**Usage:**
- On Dashboard:
  > ⚠️ At-Risk Customers (3)
  > ABC Lojistik — Not called for 45 days, last 2 quotes lost

---

### 9.4 Personnel Coaching Recommendations 🎯

**How it works:**
- Representative performance analyzed
- Low performance reasons identified
- AI generates concrete recommendations

**Usage:**
- On Admin dashboard, per representative:
  > 🎯 Recommendations for Ahmet Yılmaz:
  > - Loss due to price rate high (60%) → Review pricing strategy
  > - Average follow-up time 18 days → Activate reminders to shorten follow-up time

---

## 10. Non-Functional Requirements

### 10.1 Performance

| Metric | Target |
|--------|--------|
| Page load time | < 2 seconds |
| API response time | < 500ms |
| Search response (fuzzy) | < 1 second |
| Dashboard load | < 2 seconds |
| Support concurrent users | 50+ |

### 10.2 Scalability

- Database optimized for 10,000+ customers
- Pagination on all list views
- Lazy loading for large data sets

### 10.3 Reliability

- 99.9% uptime target
- Automated backups (daily)
- Error logging and monitoring

### 10.4 Usability

- Turkish language interface
- Form validation messages in Turkish
- Clear error messages
- Loading states
- Desktop-first responsive design

---

## 11. Acceptance Criteria

### Functionality
- [ ] All users can view all customers
- [ ] Customer duplicate prevention works
- [ ] Dynamic lists can be added and edited
- [ ] Representative transfer works correctly
- [ ] Log system records every change
- [ ] Dashboard metrics calculated correctly
- [ ] Reports export correctly

### Performance
- [ ] Lists don't slow down with 1000+ customers
- [ ] Fuzzy search completes in under 1 second
- [ ] Dashboard loads in under 2 seconds

### Security
- [ ] SQL injection protection in place
- [ ] XSS protection in place
- [ ] Admin operations only accessible to admin
- [ ] Logs cannot be edited or deleted

### UX
- [ ] Form validation messages in Turkish
- [ ] Error messages are understandable
- [ ] Loading states present
- [ ] Mobile responsive

---

## 12. Contact & Support

**Project Owner:** Hakan Gülsesli  
**Email:** [Email address]  
**Date:** March 1, 2026  

---

**This document is prepared to be directly consumable by AI-assisted development tools (Cursor, Lovable, v0.dev, etc.). Each module is detailed step-by-step for implementation.**
