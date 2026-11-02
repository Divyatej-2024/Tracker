# Tracker Chromium QA

The job-tracking dashboard uses Playwright + Chromium for isolated UI smoke tests. The suite checks initial page rendering, uncaught JavaScript errors, and horizontal overflow at mobile (390px), tablet (768px), and desktop (1365px) widths.

The test suite does not authenticate against real accounts, create or alter applications, or access external job boards. Use synthetic data and disposable test credentials for future authenticated workflow tests.

## Local run

Start the Express application with `npm install && npm start`, then run:

```bash
python -m pip install -r tests/browser/requirements.txt
python -m playwright install chromium
python -m pytest -q tests/browser
```

Set `TRACKER_BASE_URL` to a different authorised local URL. These smoke checks are not a security or full workflow assessment.
