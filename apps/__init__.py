# Makes `apps` a Python package.
# Named `apps` (not `pages`) deliberately — Streamlit Cloud auto-discovers
# any directory called `pages/` as MPA routes, which conflicts with our
# custom session-state router in suite_home.py.
