import numpy as np
import matplotlib.pyplot as plt
import pandas as pd

df = pd.read_csv("../server/emissions.csv")
# df = pd.read_csv("emissions.csv")

ax = plt.gca()

df["i"] = np.arange(df.shape[0])


def mse(df):
    return ((df["form"] - df["sumo"]) ** 1).mean(axis=0)


print(df.shape)
print("mse", mse(df))

# df.iloc[0:1000].plot(kind="line", x="i", y="form", color="green", ax=ax)
# df.iloc[0:1000].plot(kind="line", x="i", y="sumo", color="red", ax=ax)

df.iloc[0:200].plot(kind="line", x="i", y="form", color="green", ax=ax)
df.iloc[0:200].plot(kind="line", x="i", y="sumo", color="red", ax=ax)

plt.show()

# ax.savefig("output.png")
