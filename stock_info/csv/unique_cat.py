def extract_unique_categories_with_counts(file_path, output_file):
    category_counts = {}
    
    with open(file_path, 'r') as file:
        for line in file:
            # Remove any leading/trailing whitespace and split categories
            categories = line.strip().split('/')
            for category in categories:
                # Increment the count for each category
                category_counts[category] = category_counts.get(category, 0) + 1
    
    # Write unique categories and their counts to the output file
    with open(output_file, 'w') as file:
        for category, count in sorted(category_counts.items()):
            file.write(f"{category},{count}\n")
    
    print(f"Unique categories and their counts have been saved to {output_file}")

# Replace 'your_file.txt' with the path to your input file
input_file = 'new_list.txt'
# Replace 'output_file.txt' with the desired output file name
output_file = 'output_file.csv'

extract_unique_categories_with_counts(input_file, output_file)
