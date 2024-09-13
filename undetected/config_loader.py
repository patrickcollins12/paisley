# config_loader.py
import os

import json5


def load_config_old(js_file_path):
    """
    Load a JS config file using json5 to handle non-standard JSON features such as comments.
    :param js_file_path: Path to the JavaScript config file.
    :return: Dictionary with configuration data.
    """
    with open(js_file_path, 'r') as file:
        config = json5.load(file)
    return config

def load_config(js_file_path):
    """
    Load a JS config file, replacing placeholders before parsing the JSON content.
    :param js_file_path: Path to the JavaScript config file.
    :return: Dictionary with configuration data.
    """
    # Read the file content as a single string
    with open(js_file_path, 'r') as file:
        file_content = file.read()

    # Define the placeholders and their real values
    placeholders = {
        "$HOME": os.path.expanduser('~'),  # Gets the home directory
        # Add more placeholders as needed
    }

    # Replace all placeholders in the file content
    for placeholder, real_value in placeholders.items():
        file_content = file_content.replace(placeholder, real_value)

    # Parse the modified content with json5
    config = json5.loads(file_content)
    return config


# Example usage
if __name__ == "__main__":
    # Assuming the JS file is named config.js and located at the same directory level as this module.
    config_path = os.path.join(os.path.dirname(__file__), 'config.js')
    config = load_config(config_path)
    print(config)
