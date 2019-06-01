import json
import argparse

parser = argparse.ArgumentParser()

parser.add_argument("-i", "--input")
parser.add_argument("-o", "--output")
args = parser.parse_args()

inputname = args.input
outputname = args.output

with open(inputname) as f:
    data = json.load(f)
    features = data['features']
    data['features'] = features[:70000:]
    print(len(data['features']))
    with open(outputname, 'w') as outfile:
        json.dump(data, outfile)
