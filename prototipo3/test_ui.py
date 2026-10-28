from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})

        print("Navigating to http://localhost:3000...")
        page.goto("http://localhost:3000")
        time.sleep(1)
        page.screenshot(path="/tmp/landing.png")
        print("✔ Landing screenshot saved to /tmp/landing.png")

        page.click("button:has-text('Log in')")
        time.sleep(0.5)
        page.screenshot(path="/tmp/login.png")
        print("✔ Login screenshot saved to /tmp/login.png")

        page.fill("input[placeholder='Seu login global ou email']", "admin")
        page.fill("input[placeholder='••••••••']", "123456")
        page.click("button:has-text('Logar')")
        time.sleep(1)
        page.screenshot(path="/tmp/main_system.png")
        print("✔ Main system screenshot saved to /tmp/main_system.png")

        browser.close()

if __name__ == "__main__":
    run()
