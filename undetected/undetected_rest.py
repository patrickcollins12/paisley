import undetected_chromedriver as uc
from selenium.webdriver.common.by import By

driver = uc.Chrome(headless=True,use_subprocess=True)
# driver.get('https://nowsecure.nl')

# driver = uc.Chrome(use_subprocess=True)

driver.get("https://rest.com.au/")
driver.set_window_size(1111, 848)
driver.find_element(By.CSS_SELECTOR, ".btn--outlined > .icon-angle-down").click()
driver.find_element(By.LINK_TEXT, "Member login").click()
driver.find_element(By.CSS_SELECTOR, "input").send_keys("pcollins1@gmail.com")
driver.find_element(By.CSS_SELECTOR, "input").click()
driver.find_element(By.CSS_SELECTOR, ".rs-ga-tooltip").click()
driver.find_element(By.CSS_SELECTOR, ".rs-ga-container").click()
driver.find_element(By.CSS_SELECTOR, ".rs-ga-button-primary").click()
driver.find_element(By.CSS_SELECTOR, "input").send_keys("6PamzZU9wkGebstP")

driver.save_screenshot('rest.png')

driver.close()

