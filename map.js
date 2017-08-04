(() => {
	/*
	*	Initializes the map page
	*/
	App.initMap = () => {
		var data_dict = {};
		console.log('printing')
		console.log(document.getElementById('container'));
		var map = new Datamap({
			element: document.getElementById('container'),
			fills: {
	            defaultFill: '#e5e6e5', // Any hex, color name or rgb/rgba value
	            'bubble': '#000080'
	        },
	        bubblesConfig: {
	        	borderWidth: .3,
	        	borderOpacity: 1,
	        	borderColor: '#FFFFFF',
	        	popupOnHover: true,
	        },

	        scope: 'world',
	        geographyConfig: {
	        	popupOnHover: false,
	        	highlightOnHover: true,
	        },
	        arcConfig: {
	        	strokeWidth: 3,
	        	animationSpeed: 1200,
	        },
	        done: function(datamap) {
	        	datamap.svg.selectAll('.datamaps-subunit').on('click', countryClicked)
	        },

	        geographyConfig: {
	    popupTemplate: function(geo, data) { // This function should just return a string
	    	return '<div class="hoverinfo">' +
	    	'<h3>' + geo.properties.name + '</h3>' +
	    	'Amount given: $' + data_dict[geo.id]["given"] +
	    	'</div>';
	    }
	}
});


		function drawBubbles(geo){
	        //console.log(geo);
	        //draw bubbles for amount given
	        for (var i in bubbles) {
	        	var bubble = bubbles[i];



	        	if (bubble.name == geo.properties.name) {
	          //      console.log(bubble.name);
	          map.bubbles([bubble],
	          {
	          	popupTemplate: function (data) {
	          		return '<div class="hoverinfo">' +
	          		'<h3>' + data.name + '</h3>' +
	          		'Amount given: $' + data.amount_received +
	          		'</div>';
	          	}

	          });
	      }
	  }
	}


	var bubbles = [{
		name: 'Mexico',
		country: "MEX",
		radius: 5.42,
		amount_received: 555271,
		latitude: 23.20,
		longitude: -103.10,
		fillKey: 'bubble'
	},{
		name: 'Myanmar',
		radius: 16.0,
		amount_received: 21514817,
		latitude: 19.8,
		longitude: 96.15,
		fillKey: 'bubble'
	},{
		name: 'Guatemala',
		radius: 24.8,
		amount_received: 33190810,
		latitude: 14.61666667,
		longitude: -90.516667,
		fillKey: 'bubble'
	},{
		name: 'Liberia',
		radius: 38.36,
		amount_received: 510006538,
		latitude: 6.3,
		longitude: -10.8,
		fillKey: 'bubble'
	},{
		name: 'Zimbabwe',
		radius: 27.92,
		amount_received: 74234140,
		latitude: -17.816666667,
		longitude: 31.033333,
		fillKey: 'bubble'
	},{
		name: 'Georgia',
		radius: 3.57,
		amount_received: 1515547,
		latitude: 41.683333333,
		longitude: 43.833333,
		fillKey: 'bubble'
	},{
		name: 'Pakistan',
		radius: 42.9,
		amount_received: 114044556,
		latitude: 25.68333333,
		longitude: 73.05,
		fillKey: 'bubble'
	},{
		name: 'Tajikistan',
		radius: 6.26,
		amount_received: 6091705,
		latitude: 38.55,
		longitude: 71.766667,
		fillKey: 'bubble'
	},{
		name: 'Kenya',
		radius: 75,
		amount_received: 265864479,
		latitude: -1.283333333,
		longitude: 	36.816667,
		fillKey: 'bubble'
	}
	];


	/*
	 buckets: 1) public commitments made to improve national capacity; 
	 2) public commitments made to improve others’ capacity; 
	 3) public commitments made to undergo or support JEEs.
	 */

	 'use strict'
	//Depends on version of datamaps w/ country code conversion in handleArcs (http://datamaps.github.io)

	/*var data_dict = {};
	var map = new Datamap({
	  element: document.getElementById('container'),
	  fills: {
	            defaultFill: '#e5e6e5' // Any hex, color name or rgb/rgba value
	        },
	  // projection: 'mercator',
	arcConfig: {
	    strokeWidth: 3,
	    animationSpeed: 1200,
	  },
	  */  
	  
	  var usa = {
	  	id: "USA",

	  	destination_countries: [
	  	{
	  		id:"MMR",
	  		amount_given:21514817
	  	},
	  	{
	  		id:"GTM",
	  		amount_given:33190810
	  	}, 
	  	{
	  		id:"KEN",
	  		amount_given:265864479
	  	}, 
	  	{
	  		id:"LBR",
	  		amount_given:51006538
	  	},	
	  	{
	  		id:"MEX",
	  		amount_given:555271
	  	},
	  	{
	  		id:"PAK",
	  		amount_given:114044556
	  	},	
	  	{
	  		id:"TJK",
	  		amount_given:6019705
	  	},
	  	{ id: "GEO",
	  	amount_given: 1515547
	  },
	  {
	  	id:"ZWE",
	  	amount_given:74234140
	  },
	  ]
	};


	var countries = {};
	countries[usa.id] = usa;
	loadCountry("USA");
	console.log(map);
	console.log(countries);



	function loadCountry(country) {
		var country = countries[country];
		if (country == undefined) return;
		var data = [];
		data_dict = {};



		for (var j in country.destination_countries) {
			var destination_country = country.destination_countries[j];
			var link = {
				origin: country.id,
				destination: destination_country.id,

				strokeColor: destination_country.id == "VUT"? '#009999' : '#DD1C77' &&
				destination_country.id == "PAN"? '#009999' : '#DD1C77' &&
				destination_country.id == "NER"? '#009999' : '#DD1C77' &&
				destination_country.id == "CHN"? '#009999' : '#DD1C77' &&
				destination_country.id == "BLZ"? '#009999' : '#DD1C77' &&
				destination_country.id == "PRY"? '#009999' : '#DD1C77' &&
				destination_country.id == "DJI"? '#009999' : '#DD1C77' &&
				destination_country.id == "GEO"? '#e05267' : '#DD1C77' &&
				destination_country.id == "ISR"? '#009999' : '#DD1C77' &&
				destination_country.id == "JAM"? '#009999' : '#DD1C77' &&
				destination_country.id == "TLS"? '#009999' : '#DD1C77' &&
				destination_country.id == "GNB"? '#009999' : '#DD1C77' &&
				destination_country.id == "CPV"? '#009999' : '#DD1C77' &&
				destination_country.id == "UZB"? '#009999' : '#DD1C77' &&
				destination_country.id == "ARM"? '#009999' : '#DD1C77' &&
				destination_country.id == "PER"? '#009999' : '#DD1C77' &&
				destination_country.id == "PNG"? '#009999' : '#DD1C77' &&
				destination_country.id == "HND"? '#009999' : '#DD1C77' &&
				destination_country.id == "TJK"? '#cc0000' : '#DD1C77' &&
				destination_country.id == "KGZ"? '#009999' : '#DD1C77' &&
				destination_country.id == "DOM"? '#009999' : '#DD1C77' &&
				destination_country.id == "NIC"? '#009999' : '#DD1C77' &&
				destination_country.id == "LAO"? '#009999' : '#DD1C77' &&
				destination_country.id == "BWA"? '#009999' : '#DD1C77' &&
				destination_country.id == "LBN"? '#f6a2c8' : '#DD1C77' &&
				destination_country.id == "MEX"? '#e05267' : '#DD1C77' &&

				destination_country.id == "MWI"? '#4C9900' : '#DD1C77' &&
				destination_country.id == "COD"? '#4C9900' : '#DD1C77' &&
				destination_country.id == "HTI"? '#4C9900' : '#DD1C77' &&
				destination_country.id == "PAK"? '#f6a2c8' : '#DD1C77' &&
				destination_country.id == "ZMB"? '#4C9900' : '#DD1C77' &&
				destination_country.id == "MOZ"? '#4C9900' : '#DD1C77' &&
				destination_country.id == "ETH"? '#4C9900' : '#DD1C77' &&
				destination_country.id == "UGA"? '#4C9900' : '#DD1C77' &&
				destination_country.id == "TZA"? '#4C9900' : '#DD1C77' &&
				destination_country.id == "NGA"? '#4C9900' : '#DD1C77' &&
				destination_country.id == "ZAF"? '#4C9900' : '#DD1C77' &&
				destination_country.id == "KEN"? '#e05267' : '#DD1C77' &&

				destination_country.id == "IDN"? '#660066' : '#DD1C77' &&
				destination_country.id == "IND"? '#660066' : '#DD1C77' &&
				destination_country.id == "LBR"? '#cc0000' : '#DD1C77' &&
				destination_country.id == "MDG"? '#660066' : '#DD1C77' &&
				destination_country.id == "SEN"? '#660066' : '#DD1C77' &&
				destination_country.id == "PSE"? '#660066' : '#DD1C77' &&
				destination_country.id == "RWA"? '#660066' : '#DD1C77' &&
				destination_country.id == "MLI"? '#660066' : '#DD1C77' &&
				destination_country.id == "GHA"? '#660066' : '#DD1C77' &&
				destination_country.id == "AFG"? '#660066' : '#DD1C77' &&
				destination_country.id == "ZWE"? '#f6a2c8' : '#DD1C77' &&
				destination_country.id == "BDG"? '#660066' : '#DD1C77' &&

				destination_country.id == "VNM"? '#FF8000' : '#DD1C77' &&
				destination_country.id == "EGY"? '#FF8000' : '#DD1C77' &&
				destination_country.id == "NAM"? '#FF8000' : '#DD1C77' &&
				destination_country.id == "SLE"? '#FF8000' : '#DD1C77' &&
				destination_country.id == "MMR"? '#e05267' : '#DD1C77' &&
				destination_country.id == "UKR"? '#FF8000' : '#DD1C77' &&
				destination_country.id == "CMR"? '#FF8000' : '#DD1C77' &&
				destination_country.id == "BDI"? '#FF8000' : '#DD1C77' &&
				destination_country.id == "BEN"? '#FF8000' : '#DD1C77' &&
				destination_country.id == "LSO"? '#FF8000' : '#DD1C77' &&
				destination_country.id == "BFA"? '#FF8000' : '#DD1C77' &&
				destination_country.id == "CIV"? '#FF8000' : '#DD1C77' &&
				destination_country.id == "GIN"? '#FF8000' : '#DD1C77' &&
				destination_country.id == "SWZ"? '#FF8000' : '#DD1C77' &&
				destination_country.id == "GTM"? '#f6a2c8' : '#DD1C77' &&
				destination_country.id == "PHL"? '#FF8000' : '#DD1C77' &&
				destination_country.id == "SSD"? '#FF8000' : '#DD1C77' &&
				destination_country.id == "KHM"? '#FF8000' : '#DD1C77' &&
				destination_country.id == "AGO"? '#FF8000' : '#DD1C77' &&
				destination_country.id == "JOR"? '#FF8000' : '#DD1C77' &&
				destination_country.id == "NPL"? '#FF8000' : '#DD1C77',



			};


			link.given = destination_country.amount_given != undefined ? destination_country.amount_given : 100;
			data.push(link);
			data_dict[destination_country.id] = link;


		}

		map.arc(data);
	}


	//to draw bubbles and arcs on countryClicked
	function countryClicked(geo) {
		drawBubbles(geo), loadCountry(geo.id);
	}

};
})();