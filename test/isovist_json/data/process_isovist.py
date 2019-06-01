import re
import json
import argparse

parser = argparse.ArgumentParser()

parser.add_argument("-i", "--input")
parser.add_argument("-o", "--output")
args = parser.parse_args()

inputname = args.input
outputname = args.output

with open(inputname) as f:
    content = f.read()
    content = re.sub(r"}{", "},{", content)
    content = "{\"features\":[" + content + "]}"
    data = json.loads(content)
    print(len(data['features']))
    with open(outputname, 'w') as outfile:
        json.dump(data, outfile)
