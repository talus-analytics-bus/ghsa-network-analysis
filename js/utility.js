const Util = {};

(() => {
	Util.comma = d3.format(',.0f');  // rounds number and adds comma
	Util.percentize = d3.format('%');  // divides by 100 and adds a percentage symbol
	Util.formatAverageJeeScore = d3.format('.2'); // e.g., '2.3'

	// converts a number in string format into a float
	Util.strToFloat = (str) => {
		if (typeof str !== 'string') return str;
		return parseFloat(str.replace(/[^\d\.\-]/g, ''));
	};

	// capitalizes words
	Util.capitalize = (str) => {
		const strArr = str.split(' ');
		return strArr.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
	};

	// sorts an array of object by a given key
	Util.sortByKey = (array, key, reverse) => {
		array.sort((a, b) => {
			if (a[key] < b[key]) return -1;
			else if (a[key] > b[key]) return 1;
			return 0;
		});
		return reverse ? array.reverse() : array;
	};

	// function for determining whether two arrays share a common element
	Util.hasCommonElement = (arr1, arr2) => {
		const len2 = arr2.length;
		for (let i = 0; i < len2; i++) {
			if (arr1.includes(arr2[i])) return true;
		}
		return false;
	};

	// reads the value of an input and changes it to a formatted number
	Util.getInputNumVal = (input) => {
		const $input = $(input);
		const val = Util.strToFloat($input.val());
		if (val === '') return 0;
		if (isNaN(val) || val < 0) {
			$input.val(0);
			return 0;
		}

		$input.val(d3.format(',')(val));
		return val;
	};

	Util.uniqueCollection = (collection, key) => {
		const output = [];
		const groupedCollection = _.groupBy(collection, key);

		_.mapObject(groupedCollection, (val) => {
			output.push(val[0]);
		});
		return output;
	};


	Util.uniqueCollection2 = (collection, key1, key2) => {
		const output = [];
		const groupedCollection = _.groupBy(collection, d => {
			return d[key1] + d[key2];
		});

		_.mapObject(groupedCollection, (val) => {
			output.push(val[0]);
		});
		return output;
	};

	// populates a select element with the given data using d3
	Util.populateSelect = (selector, data, param = {}) => {
		let options = d3.selectAll(selector).selectAll('option')
		.data(data);
		options.exit().remove();
		const newOptions = options.enter().append('option');
		options = newOptions.merge(options)
		.attr('value', (d) => {
			if (typeof param.valKey === 'function') return param.valKey(d);
			return param.valKey ? d[param.valKey] : d;
		})
		.text((d) => {
			if (typeof param.nameKey === 'function') return param.nameKey(d);
			return param.nameKey ? d[param.nameKey] : d;
		});
		if (param.selected) {
			if (typeof param.selected === 'boolean') {
				options.attr('selected', param.selected);
			} else if (typeof param.selected === 'function') {
				options.attr('selected', (d) => {
					const val = param.valKey ? d[param.valKey] : d;
					return param.selected(val);
				});
			}
		}
	};

	// Save output for the console as JSON
	Util.save = function(data, filename){

		if(!data) {
			console.error('Console.save: No data')
			return;
		}

		if(!filename) filename = 'console.json'

		if(typeof data === "object"){
			data = JSON.stringify(data, undefined, 4)
		}

		var blob = new Blob([data], {type: 'text/json'}),
		e    = document.createEvent('MouseEvents'),
		a    = document.createElement('a')

		a.download = filename
		a.href = window.URL.createObjectURL(blob)
		a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':')
		e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
		a.dispatchEvent(e)
	};

	// Creates a scale that maps a domain to the domain of the sine function
	// from 0 to π
	Util.sineScale = (domain) => {
		const scaleTmp = d3.scaleLinear()
		.domain([domain.min, domain.max])
		.range([0, 3.1415]);
		const scale = (val) => {
			return Math.sin(scaleTmp(val));
		};
		return scale;
	};
	Util.clone_d3_selection = (selection, i) => {
		// Assume the selection contains only one object, or just work
		// on the first object. 'i' is an index to add to the id of the
		// newly cloned DOM element.
		var attr = selection.node().attributes;
		var length = attr.length;
		var node_name = selection.property("nodeName");
		var parent = d3.select(selection.node().parentNode);
		var cloned = parent.append(node_name)
		.attr("id", selection.attr("id") + i);
		for (var j = 0; j < length; j++) { // Iterate on attributes and skip on "id"
		if (attr[j].nodeName == "id") continue;
		cloned.attr(attr[j].name,attr[j].value);
	}
	return cloned;
}

/**
* Reformats App.fundingData into a more user-friendly format, amenable to
* manual analysis and comprehension by humans.
* @param  {collection} data Collection of funding data (projects)
* @return {collection}      Prettier collection of funding data
*/
Util.formatFundingDataForSharing = (data) => {
	// copy data
	const prettyData = JSON.parse(JSON.stringify(data));

	// isolate data that are duplicate projects
	const getDupeData = (prettyData) => {
		const groupedData = _.values(_.groupBy(prettyData, 'project_id'));
		// const output = [];
		// groupedData.forEach(d => {
		// 	if (d.length > 1) output.push(d);
		// })
		return groupedData;
	};

	// For each set of duplicate projects, iterate through to create single record
	// version of donors and recipients
	// const dupeData = prettyData;
	const dupeData = getDupeData(prettyData);
	const output = [];
	// console.log(dupeData);
	dupeData.forEach(projectSet => {
		// console.log(projectSet)
		const codes = {
			donor_code: [],
			recipient_country: [],
		};
		const entities = {
			donor_code: [],
			recipient_country: [],
		};
		const keyList = ['donor_code', 'recipient_country'];
		for (nKey in keyList) {
			const key = keyList[nKey];
			const drList = [];
			projectSet.forEach(p => {
				const curKey = p[key];
				if (!codes[key].includes(curKey)) {
					codes[key].push(curKey);
					if (key === 'donor_code') {
						drList.push(
							{
								donor_name: p['donor_name'],
								donor_sector: p['donor_sector'],
								donor_code: p['donor_code'],
							}
						)
					} else {
						drList.push(
							{
								recipient_name: p['recipient_name'],
								recipient_sector: p['recipient_sector'],
								recipient_country: p['recipient_country'],
							}
						)
					}
				}
			});
			entities[key] = drList;
		}

		const deleteList = [
			'recipient_name',
			'recipient_sector',
			'recipient_country',
			'donor_name',
			'donor_sector',
			'donor_code',
			'donor_name_orig',
			'recipient_name_orig',
		];

		projectSet = projectSet[0];
		deleteList.forEach(key => {
			delete projectSet[key];
		});
		projectSet.donors = entities['donor_code'];
		projectSet.recipients = entities['recipient_country'];
		output.push(projectSet);
	});

	return output;
};
})();
