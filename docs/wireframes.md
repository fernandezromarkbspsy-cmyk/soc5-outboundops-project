# UI/UX Wireframes

## Visual direction

Dense but readable AdminKit operations UI. The implemented palette uses Inter,
AdminKit navy `#222e3c`, primary blue `#3b7ddd`, a `#f5f7fb` content canvas,
compact 4 px card radii, and subtle shadows. Status is communicated by text plus
color. The wireframes describe interaction hierarchy; `dashboard.md` is the
source of truth for the implemented visual system.

## Login

```text
+-------------------------------------------------------+
| SOC 5 Outbound                    Internal operations |
|                                                       |
|  Sign in                                             |
|  [ Email or Ops ID                           ]        |
|  [ Password                                  ]        |
|  [ Sign in ]                                          |
+-------------------------------------------------------+
```

## Application shell

```text
+-------------+-----------------------------------------+
| SOC 5       | Page title                  User / role |
| Dashboard   +-----------------------------------------+
| Requests    | KPI cards / filters                     |
| Role pages  |-----------------------------------------|
|             | Responsive request table                |
|             | row -> detail drawer + event timeline   |
+-------------+-----------------------------------------+
```

Desktop uses a fixed sidebar; mobile uses a drawer and card rows. Action buttons
appear only when both role and current state permit them. Destructive actions require
confirmation. Forms retain entered values after validation errors.
