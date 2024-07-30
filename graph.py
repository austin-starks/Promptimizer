import json
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd

# Read the JSON file
with open('src/run/AI Stock Screener/prompt_summary.json', 'r') as file:
    data = json.load(file)

# Convert to DataFrame
df = pd.DataFrame(data)

df = df[df['generationNumber'] <= 45]

# Normalize the fitness values to percentages
df['averageTrainingFitness'] = (df['averageTrainingFitness'] / 48) * 100  
df['averageValidationFitness'] = (df['averageValidationFitness'] / 12) * 100

# Set up the plot style
sns.set(style="white", rc={"axes.grid": False})  # Turn off the grid specifically

# Create the figure and axis objects
fig, ax1 = plt.subplots(figsize=(14, 7))

# Plot training fitness
line1 = ax1.plot(df['generationNumber'], df['averageTrainingFitness'], 
                 label='Training Fitness', linewidth=2.5, marker='o', markersize=8, linestyle='-', color='#0072B2')
ax1.set_xlabel('Generation', fontsize=14)
ax1.set_ylabel('Average Training Fitness (%)', fontsize=14)
ax1.tick_params(axis='both', which='major', labelsize=12)

# Create a second y-axis for validation fitness
ax2 = ax1.twinx()
line2 = ax2.plot(df['generationNumber'], df['averageValidationFitness'], 
                 label='Validation Fitness', linewidth=2.5, marker='s', markersize=8, linestyle='-', color='#D55E00')
ax2.set_ylabel('Average Validation Fitness (%)', fontsize=14)
ax2.tick_params(axis='y', which='major', labelsize=12)

# Combine legends
lines = line1 + line2
labels = [l.get_label() for l in lines]
legend = ax1.legend(lines, labels, loc='upper left', fontsize=12, frameon=True, shadow=True)

# Set title
plt.title('Training and Validation Fitness over Generations', fontsize=16, fontweight='bold')

# Adjust layout and display
plt.tight_layout()
plt.show()

# Save the figure
plt.savefig('fitness_over_generations.png', dpi=300, bbox_inches='tight')
