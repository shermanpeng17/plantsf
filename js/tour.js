// Instance the tour
var tour = new Tour({
  storage: window.localStorage, // set storage to false during development
});

tour.addSteps([
  {
    element: ".stepWelcome",
    placement: 'right',
    title: "Welcome to the Plant Finder",
    content: "Do you need some help using the Plant Finder? Press Next to continue and press End Tour if you know what you're looking for!"
  },
  {
    element: "#preselected",
    placement: "left",
    title: "Start with a Master List",
    content: "After clicking one of the three, use the filters to refine your list."
  },
  {
    element: ".stepLocation",
    placement: 'left',
    title: "Search by Location",
    content: "Enter where you'd like to plant and click on the Search button."
  },
  {
    element: ".stepCityLists",
    placement: 'left',
    title: "You Can Search by City Lists",
    content: "Use the filters to refine your list for habitat-friendly plants after starting with one of these City List categories."
  },
  {
    element: ".stepPlantPalettes",
    placement: 'left',
    title: "You Can Search by Plant Palettes",
    content: "Shorter, pre-selected palettes to give you good ideas for appropriate species for landscaping in San Francisco."
  },
  {
    element: ".stepfilter",
    placement: 'left',
    title: "You Can Filter",
    content: "Click on any of the checkboxes to filter your results."
  },

  // {
  //   element: "$(.fa-heart).first()",
  //   placement: "left",
  //   title: "You Can Create Favorites",
  //   content: "Click on the heart icon to create a list of favorites displayed to the right"
  // },
  {
    element: ".stepCustomList",
    placement: 'right',
    title: "Custom List",
    content: "Click on any of the Shopping Cart icons in your plant list to add them to the Custom List.  This may be helpful if you wish to take a list of your favorite plants to a nursery."
  },
  {
    element: ".stepAbout",
    placement: 'left',
    title: "Learn More",
    content: "Visit the About page to learn more about the Plant Finder, download the data set and give feedback."
  },
  {
    element: ".stepGlossary",
    placement: 'left',
    title: "Learn More",
    content: "Check out the Glossary page to speak plant lingo fluently."
  },
  {
    element: ".stepResources",
    placement: 'bottom',
    title: "Learn More",
    content: "Information on Plant Palettes, City Lists and much more are found in Resources page."
  }
])


// Start the tour with the button
$('.start-tour').click(function(){
  tour.init();
  tour.restart();
});
