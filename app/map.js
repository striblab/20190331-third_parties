import 'intersection-observer';
import * as d3 from 'd3';
import * as topojson from "topojson";
import pct from '../sources/mnpct-shifts.json';
import mn from '../sources/mncd.json';
import mncounties from '../sources/counties.json'; 
import roads from '../sources/roads.json'; 

class Map {

    constructor(target) {
        this.target = target;
        this.svg = d3.select(target + ' svg')
            .attr('width', $(target).outerWidth())
            .attr('height', $(target).outerHeight());
        this.g = this.svg.append('g');
        this.zoomed = false;
        this.scaled = $(target).width() / 520;
        this.colorScale = d3.scaleOrdinal()
            .domain(['LESS', 'EVEN', 'MORE'])
            .range(['#F2AF80', '#857AAA', '#9EE384']);
    }

    /********** PRIVATE METHODS **********/

    // Detect if the viewport is mobile or desktop, can be tweaked if necessary for anything in between
    _detect_mobile() {
        var winsize = $(window).width();

        if (winsize < 600) {
            return true;
        } else {
            return false;
        }
    }

    _clickmn(district) {
        var self = this;

        //D3 CLICKY MAP BINDINGS
        jQuery.fn.d3Click = function() {
            this.each(function(i, e) {
                var evt = document.createEvent('MouseEvents');
                evt.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

                e.dispatchEvent(evt);
                return false;
            });
        };

        jQuery.fn.d3Down = function() {
            this.each(function(i, e) {
                var evt = document.createEvent('MouseEvents');
                evt.initMouseEvent('mousedown', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

                e.dispatchEvent(evt);
                return false;
            });
        };

        jQuery.fn.d3Up = function() {
            this.each(function(i, e) {
                var evt = document.createEvent('MouseEvents');
                evt.initMouseEvent('mouseup', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);

                e.dispatchEvent(evt);
                return false;
            });
        };

        // Your mouse clicks are actually three events, which are simulated here to auto-zoom the map on a given id of a map path object
        $(self.target + " [id='" + district + "']").d3Down();
        $(self.target + " [id='" + district + "']").d3Up();
        $(self.target + " [id='" + district + "']").d3Click();

    }

    _populate_colors(filtered, magnify, party, geo, race, data) {

        var self = this;

        var index = Number(filtered);

        if (filtered != "all") {
            $(self.target + " .district").addClass("faded");
            //$(self.target + " .county").addClass("hidden");
            $(self.target + " ." + filtered).removeClass("faded");
            $(self.target + " .CD1, " + self.target + " .CD2, " + self.target + " .CD3, " + self.target + ".CD4, " + self.target + " .CD5, " + self.target + " .CD6, " + self.target + " .CD7, " + self.target + " .CD8").addClass("infocus");
            $(self.target + " .district").removeClass("hidden");
            $(self.target + "#P" + race).addClass("hidden");
        } else {
            $(self.target + " .CD1, " + self.target + " .CD2, " + self.target + " .CD3, " + self.target + ".CD4, " + self.target + " .CD5, " + self.target + " .CD6, " + self.target + " .CD7, " + self.target + " .CD8").removeClass("infocus");
            $(self.target + " .CD1, " + self.target + " .CD2, " + self.target + " .CD3, " + self.target + ".CD4, " + self.target + " .CD5, " + self.target + " .CD6, " + self.target + " .CD7, " + self.target + " .CD8").removeClass("hidden");
            $(self.target + " .district").addClass("hidden");
            // $(".county").addClass("hidden");
        }

        var tooltip = function(accessor) {
            return function(selection) {
                var tooltipDiv;
                var bodyNode = d3.select('body').node();
                    selection.on("mouseover", function(d, i) {
                        // Clean up lost tooltips
                        d3.select('body').selectAll('div.tooltip').remove();
                        // Append tooltip
                        tooltipDiv = d3.select('body').append('div').attr('class', 'tooltip');
                        // var absoluteMousePos = d3.mouse(bodyNode);
                        // console.log(d3.event.pageX);
                        // console.log(absoluteMousePos);
                        tooltipDiv.style('left', (d3.event.pageX + 10) + 'px')
                            .style('top', (d3.event.pageY - 15) + 'px')
                            .style('position', 'absolute')
                            .style('z-index', 1001);
                        // Add text using the accessor function
                        var tooltipText = accessor(d, i) || '';

                        tooltipDiv.html(tooltipText);
                        $("#tip").html(tooltipText);

                        if (self._detect_mobile() == true) {
                            $("#tip").show();
                            // $(".key").hide();
                        }
                        // Crop text arbitrarily
                        //tooltipDiv.style('width', function(d, i){return (tooltipText.length > 80) ? '300px' : null;})
                        //    .html(tooltipText);
                    })
                    .on('mousemove', function(d, i) {
                        // Move tooltip
                        tooltipDiv.style('left', (d3.event.pageX + 10) + 'px')
                            .style('top', (d3.event.pageY - 15) + 'px');

                    })
                    .on("mouseout", function(d, i) {
                        // Remove tooltip
                        tooltipDiv.remove();
                        $("#tip").hide();
                        // $(".key").show();
                        $("#tip").html("");
                    }).on("mouseleave", function(){
                        $(".shifter").removeClass("arrowselect");
                    }); 

            };
        };

        this.g.selectAll(self.target + ' .precincts path')
            .call(tooltip(function(d, i) {
                $(".shifter").removeClass("arrowselect");
                $("#arrow" + d.properties.join).addClass("arrowselect");

                var shifter;
                var can1;
                var can2;
                var party1;
                var party2;

                if (d.properties.shifts_r_pct18 > d.properties.shifts_d_pct18) {
                    can1 = d3.format(".1f")(d.properties.shifts_r_pct18);
                    can2 = d3.format(".1f")(d.properties.shifts_d_pct18);
                    party1 = 'GOP';
                    party2 = 'DFL';
                } else {
                    can2 = d3.format(".1f")(d.properties.shifts_r_pct18);
                    can1 = d3.format(".1f")(d.properties.shifts_d_pct18);
                    party1 = 'DFL';
                    party2 = 'GOP'
                }

                if (d.properties.shifts_shift == "D") {
                    shifter = "⇦ " + d.properties.shifts_shift + "+" + d3.format(".1f")(d.properties.shifts_shift_pct);
                } else {
                    shifter = d.properties.shifts_shift + "+" + d3.format(".1f")(d.properties.shifts_shift_pct) + " ⇨";
                }

                if (d.properties.shifts_shift_pct != 0 && d.properties.shifts_shift_pct != null && d.properties.shifts_shift_pct != "null") {
                    return '<h4 id="title">' + d.properties.PCTNAME + '</h4> \
                    <div><span class="legendary" style="background-color:' + self.colorScale(d.properties.diffs_FLAG) + '">' + d3.format("+")(d.properties.diffs_DFL_DIFF) + '</span> point difference</div>';
                } else {
                    return '<h4 id="title">' + d.properties.PCTNAME + '</h4>';
                }
                
                return '<h4 id="title">No data</h4>';
            }))
            .transition()
            .duration(600)
            .style('fill', function(d) {
                return self.colorScale(d.properties.diffs_FLAG);
            });

        if (race == "1") {
            self._clickmn("P1");
            $(".reset").hide();
        } else if (race == "2") {
            self._clickmn("P2");
            $(".reset").hide();
        } else if (race == "3") {
            self._clickmn("P3");
            $(".reset").hide();
        } else if (race == "8") {
            self._clickmn("P8");
            $(".reset").hide();
        }

    }

    /********** PUBLIC METHODS **********/

    // Render the map
    render(filtered, magnify, party, geo, race, data) {
        var self = this;

        var projection = d3.geoMercator().scale(5037).translate([50, 970]);

        var width = 520;
        var height = 0;

        if (race == "1") {
            height = 350;
        } else if (race == "2") {
            height = 400;
        }  else if (race == "3") {
            height = 400;
        }  else if (race == "8") {
            height = 400;
        } 

        var centered;

        var path = d3.geoPath(projection);

        var states = topojson.feature(pct, pct.objects.convert);
        var state = states.features.filter(function(d) {
            return d.properties.CONGDIST == filtered;
        })[0];

        var b = path.bounds(state),
            s = .95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
            t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];

        var cachedWidth = window.innerWidth;
        d3.select(window).on('resize', function() {
            var newWidth = window.innerWidth;
            if (newWidth !== cachedWidth) {
                cachedWidth = newWidth;
            }
        });

        //Draw precincts
        self.g.append('g')
            .attr('class', 'precincts')
            .selectAll('path')
            .data((topojson.feature(pct, pct.objects.convert).features).filter(function(d) {
                if (filtered != "all") {
                    return d.properties.CONGDIST == race;
                } else {
                    return d.properties.CONGDIST != 'blarg';
                }
            }))
            .enter().append('path')
            .attr('d', path)
            .attr('class', function(d) {
                return 'precinct CD' + d.properties.CONGDIST;
            })
            .attr('id', function(d) {
                return 'P' + d.properties.VTDID;
            })
            .style('stroke-width', '0.3px')
            .style('fill', '#888888');

            //Draw roads
            self.g.append('g')
            .attr('class', 'roads')
            .selectAll('path')
            .data(topojson.feature(roads, roads.objects.convert).features)
            .enter().append('path')
            .attr("class", function(d) {
                return 'road ' + d.properties.RTTYP;
            })
            .attr('d', path)
            .attr('fill', 'none')
            .attr('stroke-width', '0.5px')
            .attr('stroke','#bcbcbc');

        //Draw county borders
        self.g.append('g')
        .attr('class', 'counties')
        .selectAll('path')
        .data(topojson.feature(mncounties, mncounties.objects.counties).features)
        .enter().append('path')
        .attr("class", "county")
        .attr('d', path)
        .attr('fill', 'none')
        .attr('stroke-width', '2px')
        .attr('stroke', '#ffffff');

        var features = (topojson.feature(pct, pct.objects.convert).features).filter(function(d) {
            if (filtered != "all") {
                return d.properties.CONGDIST == race && d.properties.shifts_shift != "#N/A"  && d.properties.shifts_shift != null && d.properties.shifts_shift_pct != 0;
            }
        });

        var centroids = features.map(function(feature) {
            return path.centroid(feature);
        });

        //Draw congressional district borders
        self.g.append('g')
            .attr('class', 'districts')
            .selectAll('path')
            .data(topojson.feature(mn, mn.objects.mncd).features)
            .enter().append('path')
            .attr('d', path)
            .attr('class', function(d) {
                return 'district CD' + d.properties.DISTRICT;
            })
            .attr('id', function(d) {
                return 'P' + d.properties.DISTRICT;
            })
            .style('stroke-width', '0.5px')
            .style('stroke',"#ababab")
            .on('mousedown', function(d) {})
            .on('click', function(d) {
                if (d.properties.DISTRICT == "5") {
                    clicked(d, 23);
                    $(self.target + " .CD1, " + self.target + " .CD2, " + self.target + " .CD3, " + self.target + ".CD4, " + self.target + " .CD5, " + self.target + " .CD6, " + self.target + " .CD7, " + self.target + " .CD8").addClass("infocus");
                    $("#P" + d.properties.DISTRICT).addClass("hidden");
                } else {
                    if (race == "1") {
                        clicked(d, 1);
                    } else if (race == "2") {
                        clicked(d, 2.8);
                    } else if (race == "3") {
                        clicked(d, 6.4);
                    } else if (race == "8") {
                        clicked(d, 0.80);
                    }
                }
            });

                        //City labels
                        var marks = [{
                            long: -92.100485,
                            lat: 46.786672,
                            name: "Duluth"
                        },
                        {
                            long: -93.349953,
                            lat: 44.889687,
                            name: "Edina"
                        },
                        {
                            long: -93.275772,
                            lat: 44.762058,
                            name: "Burnsville"
                        },
                        {
                            long: -93.455788,
                            lat: 45.072464,
                            name: "Maple Grove"
                        },
                        {
                            long: -93.473892,
                            lat: 45.018269,
                            name: "Plymouth"
                        },
                        {
                            long: -93.999400,
                            lat: 44.163578,
                            name: "Mankato"
                        },
                        {
                            long: -92.480199,
                            lat: 44.012122,
                            name: "Rochester"
                        },
                        {
                            long: -94.202008,
                            lat: 46.352673,
                            name: "Brainerd"
                        },
                        {
                            long: -92.5338,
                            lat: 44.5625,
                            name: "Red Wing"
                        }
                    ];

            self.g.append('g').attr('class', 'labelbg').selectAll("text")
            .data(marks)
            .enter()
            .append("text")
            .attr('class', function(d) {
                return 'label-bg ' + d.name;
            })
            .attr("transform", function(d) {
                if (race == "1" || race == "8") { return "translate(" + projection([d.long, d.lat - 0.08]) + ")"; }
                else if (race == "2" || race == "3") { return "translate(" + projection([d.long, d.lat]) + ")"; }
            })
            // .style("opacity",0)
            .text(function(d) {
                return " " + d.name;
            });

            self.g.append('g').attr('class', 'labels').selectAll("text")
                .data(marks)
                .enter()
                .append("text")
                .attr('class', function(d) {
                    return 'city-label ' + d.name;
                })
                .attr("transform", function(d) {
                    if (race == "1" || race == "8") { return "translate(" + projection([d.long, d.lat - 0.08]) + ")"; }
                    else if (race == "2" || race == "3") { return "translate(" + projection([d.long, d.lat]) + ")"; }
                })
                // .style("opacity",0)
                .text(function(d) {
                    return " " + d.name;
                });



        function clicked(d, k) {
            var x, y, stroke;

            // if (d && centered !== d) {
            var centroid = path.centroid(d);
            x = centroid[0];
            y = centroid[1];
            centered = d;
            stroke = 0.2;
            $(self.target + ' .reset').show();
            // } 
            // else {
            //   x = width / 2;
            //   y = height / 2;
            //   k = 1;
            //   centered = null;
            //   stroke = 1.5;
            //   $(self.target + ' .reset').hide();
            // }

            // $(".city-label").addClass("hidden");
            // $(".mark").addClass("hidden");

            self.g.transition()
                .duration(300)
                .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')scale(' + k + ')translate(' + -x + ',' + -y + ')')
                .style('stroke-width', '0.2px');

        }


        var aspect = 520 / 600,
            chart = $(self.target + ' svg');
        var targetWidth = chart.parent().width();
        chart.attr('width', targetWidth);
        chart.attr('height', targetWidth / aspect);
        if ($(window).width() <= 520) {
            $(self.target + ' svg').attr('viewBox', '0 0 500 600');
        }

        $(window).on('resize', function() {
            targetWidth = chart.parent().width();
            chart.attr('width', targetWidth);
            chart.attr('height', targetWidth / aspect);
        });

        //COLOR THE MAP WITH LOADED DATA
        self._populate_colors(filtered, magnify, party, geo, race, data);
    }
}

export {
    Map as
    default
}