---
applyTo: "**/*.{sql,js,ts}"
---

# PCMC BillPro Database Rules

Before changing a model/schema:

1. Search every reference.
2. Check foreign keys.
3. Check MB references.
4. Check RA Bill references.
5. Check project isolation.
6. Check migrations.
7. Verify existing data compatibility.

Never delete production fields casually.
