# YAML skill → LinkedIn canonical mapping

LinkedIn skills come from a fixed vocabulary; many `resume.yaml` skill names don't
exist verbatim. This table records the canonical LinkedIn skill each YAML keyword
maps to, so the sync is **stable and idempotent** (same input → same LinkedIn skill
every run, no re-adding or duplication). When a new YAML skill has no verbatim
LinkedIn match, pick the closest canonical suggestion and **record it here**.

`slug` is from `resume.yaml` `skills[].keywords[].slug`. "LinkedIn skill" is the
exact canonical name to select in the Add-skill typeahead. `✓ verbatim` means the
YAML `name` matches LinkedIn's canonical exactly.

| YAML slug | YAML name | LinkedIn skill (canonical) | Note |
|---|---|---|---|
| ai-native-software-engineering | AI-Native Software Engineering | **AI Engineering** | pinned:1 · no exact term; AI Engineering is closest |
| ai-harness-engineering | AI Harness Engineering | AI Harness Engineering | ✓ verbatim |
| ai-agent-orchestration-team-design | AI Agent Orchestration & Team Design | **AI Agents** | closest |
| llm-application-architecture | LLM Application Architecture | **Large Language Models (LLM)** | closest |
| prompt-engineering | Prompt Engineering | Prompt Engineering | ✓ verbatim |
| ai-assisted-development-workflows | AI-Assisted Development Workflows | *(unmapped — no good canonical)* | skip or user-choose |
| security-architecture | Security Architecture | **Security Architecture Design** | pinned:2 · no exact "Security Architecture" |
| secure-development-lifecycle-sdl | Secure Development Lifecycle (SDL) | Secure Development Lifecycle (SDL) | ✓ |
| compliance-automation-continuous-compliance | Compliance Automation & Continuous Compliance | **Compliance Engineering** | closest (kept existing) |
| devsecops | DevSecOps | DevSecOps | ✓ |
| static-code-analysis | Static Code Analysis | Static Code Analysis | ✓ |
| cloud-security | Cloud Security | Cloud Security | ✓ |
| threat-modeling | Threat Modeling | Threat Modeling | ✓ |
| digital-rights-management-drm | Digital Rights Management (DRM) | **DRM** | LinkedIn shortens to DRM |
| public-key-cryptography | Public Key Cryptography | Public Key Cryptography | ✓ |
| complex-systems-architecture | Complex Systems Architecture | Complex Systems Architecture | ✓ |
| platform-engineering | Platform Engineering | Platform Engineering | ✓ |
| distributed-systems | Distributed Systems | Distributed Systems | ✓ |
| api-design | API Design | **Application Programming Interfaces (API)** | no exact "API Design" |
| data-pipelines | Data Pipelines | *(dropped near cap)* | add if room |
| interoperability | Interoperability | Interoperability | ✓ |
| scalability | Scalability | Scalability | ✓ |
| continuous-integration | Continuous Integration | **Continuous Integration (CI)** | closest |
| engineering-leadership | Engineering Leadership | Engineering Leadership | pinned:3 · ✓ |
| executive-communication | Executive Communication | Executive Communication | ✓ |
| cross-functional-team-leadership | Cross-Functional Team Leadership | Cross-functional Team Leadership | ✓ |
| program-product-management | Program & Product Management | **Program Management** | closest |
| technical-strategy | Technical Strategy | **IT Strategy** | no exact "Technical Strategy" |
| people-development-coaching | People Development & Coaching | **People Management** | closest (kept existing) |
| startup-founding-fundraising | Startup Founding & Fundraising | **Entrepreneurship** | closest (kept existing) |
| standards-development | Standards Development | Standards Development | ✓ |
| patents-intellectual-property | Patents & Intellectual Property | Patents & Intellectual Property | ✓ |
| protocol-design | Protocol Design | Protocol Design | ✓ |
| file-format-design | File Format Design | File Format Design | ✓ |
| entity-relationship-modeling | Entity-Relationship Modeling | **Data Modeling** | closest |
| c-net | C# / .NET | **C#** | plus .NET via net-framework-asp-net below |
| c-c | C / C++ | **C++** | |
| typescript-javascript | TypeScript / JavaScript | **TypeScript** + **JavaScript** | split into the two atomic skills |
| java | Java | Java | ✓ |
| python | Python | **Python (Programming Language)** | LinkedIn's canonical |
| smalltalk | Smalltalk | Smalltalk | ✓ |
| z80-x86-assembly | Z80 & x86 Assembly | **Assembly Language** | closest |
| sql | SQL | SQL | ✓ |
| xml-sgml | XML / SGML | **XML** | |
| net-framework-asp-net | .NET Framework / ASP.NET | **.NET Framework** + **ASP.NET** | |
| azure-azure-devops | Azure / Azure DevOps | **Azure DevOps** | |
| github-codeql | GitHub / CodeQL | **GitHub** | |
| react | React | React | ✓ |
| node-js | Node.js | Node.js | ✓ |
| windows | Windows | Windows | ✓ |
| relational-databases | Relational Databases | Relational Databases | ✓ |
| object-databases | Object Databases | *(dropped near cap)* | add if room |

**Pinned (Top skills) order:** 1) AI Engineering, 2) Security Architecture Design,
3) Engineering Leadership. (from `pinned: 1/2/3`.)

**Cap note:** LinkedIn limits the skill list (historically 50). If over the cap,
the lowest-value entries to drop are the `*(dropped near cap)*` rows above.
