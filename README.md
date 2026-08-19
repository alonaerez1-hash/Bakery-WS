# Bakery WS

Bakery WS is a separate English-language SaaS workspace for independent bakeries in the U.S.

## V1 product decisions

- English, LTR interface
- Operating currency: USD or ILS
- Email + password authentication (Supabase-ready adapter)
- Free and Pro plans
- Connected workflow: Order → Recipe → Production → Inventory/Shopping → Profit

## V1 modules

- Overview dashboard
- Orders
- Customers
- Recipes and true-cost pricing
- Inventory and shopping list
- Production demand and tasks
- Profitability
- Business settings

## Cost engine

Recipe true cost includes:

- ingredients
- waste
- labor
- packaging
- overhead

The same engine powers recipe pricing, order profitability and portfolio profitability.

## Authentication

`auth.js` is ready for Supabase email/password authentication. Until the new Bakery WS backend is created, the app exposes an explicit local Preview mode for product testing. No credentials or private secrets are stored in this repository.

## Plans

V1 beta defaults:

- Free: up to 3 recipes and 10 orders/month, recipe costing, inventory and shopping
- Pro: unlimited recipes/orders, production planning and full profitability

These limits are product defaults for beta and can be changed before launch.

## Development checks

```bash
node --check core.js
node --check store.js
node --check auth.js
node --check app.js
node tests/run-tests.js
```

GitHub Actions runs the same checks on pull requests.
