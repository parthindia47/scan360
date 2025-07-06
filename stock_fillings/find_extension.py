def extract_file_extensions(file_path):
    # Set to store unique file extensions
    extensions = set()
    zip_count = 0

    # Open the file and read line by line with UTF-8 encoding
    with open(file_path, 'r', encoding='utf-8') as file:
        for line in file:
            # Remove any leading/trailing whitespace (like newlines)
            url = line.strip()

            # Extract the file name from the URL (after the last slash "/")
            if '/' in url:
                file_name = url.split('/')[-1]
            else:
                file_name = url

            # Split file name by dot and get the last part as the extension
            if '.' in file_name:
                extension = file_name.split('.')[-1]
                extensions.add(extension)
                
            # if extension == "jpg":
            #     print(url)
                
            if extension == "zip":
                print(url)
                zip_count = zip_count + 1

    print("Zip counts " + str(zip_count))
    return extensions


# Example usage:
file_path = 'attachment_link.txt'  # File containing URLs
unique_extensions = extract_file_extensions(file_path)
print("Unique file extensions found:")
print(unique_extensions)
