import undetected_chromedriver as uc

from config_loader import load_config

config = load_config("/Users/pcollins/paisley/config.json5")
print(config['csv_watch'])  # Access a specific configuration parameter
print(config['ChaseCardsCSVParser']['identifier'])  # Access a specific configuration parameter

# driver = uc.Chrome(headless=True,use_subprocess=True)
# driver.get('https://nowsecure.nl')
# driver.save_screenshot('nowsecure.png')
# # driver = uc.Chrome(use_subprocess=True)