import json
import argparse
import re

parser = argparse.ArgumentParser()

parser.add_argument("-i", "--input")
parser.add_argument("-o", "--output")
args = parser.parse_args()

inputname = args.input
outputname = args.output

with open(inputname) as f:
    content = f.read()

    content = re.sub(r"new Arc", "\"new Arc", content)
    content = re.sub(r"\),", ")\",", content)
    content = re.sub(r",]}", "]}", content)
    data = json.loads(content)
    features = data['arcs']
    newfeatures = []
    for arc in features:
        elem = re.sub("[ a-zA-Z\(\[\]\)]", "", arc)
        elem = elem.split(",")

        newcontent = {"position":[elem[0] + "," + elem[1]], "radius":elem[2],"alpha":elem[3],"omega":elem[4]}
        newfeatures.append(newcontent)
    data['arcs'] = newfeatures
    with open(outputname, 'w') as outfile:
        json.dump(data, outfile)
