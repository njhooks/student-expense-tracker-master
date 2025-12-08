Copilot Reflection
How I used GitHub Copilot

I used GitHub Copilot while working on my React Native expense tracker project, mainly to help add new features and fix issues as I ran into them. One of the main ways I used Copilot was through the inline /generate feature in ExpenseScreen.js. I asked it to help me add a bar chart that shows total spending by category using react-native-chart-kit.

The prompt I gave was along the lines of:

“Add a bar chart that visualizes total expenses per category using react-native-chart-kit and updates when expenses or filters change.”

Copilot suggested code to organize the category totals into chart data and showed how to render the <BarChart /> component using state that already existed in my app.

A Copilot suggestion I changed or rejected

One thing Copilot suggested was adding extra layout wrappers and spacing styles around the chart. When I first tried this, it caused the chart to appear more than once on the screen and added unnecessary UI elements. I removed those extra sections and kept only one conditional chart block that was already tied to my existing data.

By doing this, the chart stayed clean, only rendered once, and continued to update correctly based on real expense data.

How Copilot saved me time

Copilot saved me a lot of time because it gave me a working starting point for displaying chart data. Instead of having to look up how to connect react-native-chart-kit to dynamically calculated totals, Copilot generated most of the structure for me. I was then able to focus on adjusting the code and fixing layout issues rather than building everything from scratch.
