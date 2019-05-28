/**
 * Main JS file for project.
 */

// Define globals that are added through the js.globals in
// the config.json file, here, mostly so linting won't get triggered
// and its a good queue of what is available:
// /* global _ */

// Dependencies
import utils from './shared/utils.js';

// Mark page with note about development or staging
utils.environmentNoting();



// Adding dependencies
// ---------------------------------
// Import local ES6 or CommonJS modules like this:
// import utilsFn from './shared/utils.js';
//
// Or import libraries installed with npm like this:
// import module from 'module';

// Adding Svelte templates in the client
// ---------------------------------
// We can bring in the same Svelte templates that we use
// to render the HTML into the client for interactivity.  The key
// part is that we need to have similar data.
//
// First, import the template.  This is the main one, and will
// include any other templates used in the project.
// import Content from '../templates/_index-content.svelte.html';
//
// Get the data parts that are needed.  There are two ways to do this.
// If you are using the buildData function to get data, then ?
//
// 1. For smaller datasets, just import them like other files.
// import content from '../assets/data/content.json';
//
// 2. For larger data points, utilize window.fetch.
// let content = await (await window.fetch('../assets/data/content.json')).json();
//
// Once you have your data, use it like a Svelte component:
//
// const app = new Content({
//   target: document.querySelector('.article-lcd-body-content'),
//   data: {
//     content
//   }
// });

import * as d3 from 'd3';
import Map from './map.js';
import dataLoad from '../sources/results.json'

const map2 = new Map("#map2");

map2.render("CD2", "mn", "GOP", "all", "2", null);


    //load data into a variable
    var data = dataLoad.results;

    //D3 data population loop
    d3.select('#table').selectAll('.contest-table')
        .data(data)
        // .data(dataAlphabet.sort(function(x, y){ return d3.descending(x.letter, y.letter); }))
        // .data(dataAlphabet.filter(function(d){ return d.letter != "X"; }))
        .enter()
        .append('div')
        .attr('class', function(d) {
            //assign letter class
            return 'letter';
        })
        .style('color',function(d) {
            //assign color style
            return '#880000';
        })
        .html(function(d) {
            //write contents to div
            return '<div class="cell td">' + d.COMBINE16 + '</div><div class="cell td">' + d.CRAIG_18 + '</div><div class="cell td">' + d.DFL_DIFF + '</div><div class="cell td">' + d.GOP_DIFF + '</div>';
        });