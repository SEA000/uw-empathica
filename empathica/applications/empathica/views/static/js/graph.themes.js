/** 
    Themes define the appearance of the nodes and edges of the graph. 
    
    Theme properties follow a fairly intuitive naming convention where
    
    Normal  - normal appearance with no modifiers
    Hover   - appearance when the cursor is over the specified object
    Focused - appearance when the object is part of the selection
    
    Note: The DEFAULT theme should never be removed. 
    
    Author:         Eugene Solodkin
    Last Updated:   2012-01-31
 **/ 

var THEMES = {

    DEFAULT: {
        themeName:                      "Default Theme",
        
        nodeFontFamily:                 "Verdana",
        nodeFontSize:                   "14px",
        nodeFontLineHeight:             "20px",
        nodeGlowDirX:                   "1px",
        nodeGlowDirY:                   "1px",
        nodeGlowSize:                   "1px",
        nodeFontGlowDirX:               "1px",
        nodeFontGlowDirY:               "1px",
        nodeFontGlowSize:               "1px",
        nodeSelectionHandles:           "rgba(0,0,128,255)",
        
        edgeGlowSize:                   "5px",

        positiveNode: {
            fill: {
                normal:                 "rgba(215,255,215,255)",
                hover:                  "rgba(245,255,245,255)",
                focused:                "rgba(245,255,245,255)"
            },
            
            line: {
                normal:                 "rgba(0,255,0,255)",
                hover:                  "rgba(0,255,0,255)",
                focused:                "rgba(0,255,0,255)"
            },
            
            glow: {
                normal:                 "rgba(255,255,255,255)",
                hover:                  "rgba(255,255,255,255)",
                focused:                "rgba(255,255,255,255)"
            },
            
            font: {
                normal:                 "rgba(0,0,0,255)",
                hover:                  "rgba(0,0,0,255)",
                focused:                "rgba(0,0,0,255)"
            },
            
            fontGlow: {
                normal:                 "rgba(255,255,255,255)",
                hover:                  "rgba(255,255,255,255)",
                focused:                "rgba(255,255,255,255)"
            }
        },
        
        neutralNode: {
            fill: {
                normal:                 "rgba(255,255,215,255)",
                hover:                  "rgba(255,255,245,255)",
                focused:                "rgba(255,255,245,255)"
            },
            
            line: {
                normal:                 "rgba(255,255,0,255)",
                hover:                  "rgba(255,255,0,255)",
                focused:                "rgba(255,255,0,255)"
            },
            
            glow: {
                normal:                 "rgba(255,255,255,255)",
                hover:                  "rgba(255,255,255,255)",
                focused:                "rgba(255,255,255,255)"
            },
            
            font: {
                normal:                 "rgba(0,0,0,255)",
                hover:                  "rgba(0,0,0,255)",
                focused:                "rgba(0,0,0,255)"
            },
            
            fontGlow: {
                normal:                 "rgba(255,255,255,255)",
                hover:                  "rgba(255,255,255,255)",
                focused:                "rgba(255,255,255,255)"
            }
        },
        
        negativeNode: {
            fill: {
                normal:                 "rgba(255,215,215,255)",
                hover:                  "rgba(255,245,245,255)",
                focused:                "rgba(255,245,245,255)"
            },
            
            line: {
                normal:                 "rgba(255,0,0,255)",
                hover:                  "rgba(255,0,0,255)",
                focused:                "rgba(255,0,0,255)"
            },
            
            glow: {
                normal:                 "rgba(255,255,255,255)",
                hover:                  "rgba(255,255,255,255)",
                focused:                "rgba(255,255,255,255)"
            },
            
            font: {
                normal:                 "rgba(0,0,0,255)",
                hover:                  "rgba(0,0,0,255)",
                focused:                "rgba(0,0,0,255)"            
            },
            
            fontGlow: {
                normal:                 "rgba(255,255,255,255)",
                hover:                  "rgba(255,255,255,255)",
                focused:                "rgba(255,255,255,255)"
            }
        },
        
        ambivalentNode: {
            fill: {
                normal:                 "rgba(255,170,240,255)",
                hover:                  "rgba(255,210,240,255)",
                focused:                "rgba(255,210,240,255)"
            },
            
            line: {
                normal:                 "rgba(150,0,100,255)",
                hover:                  "rgba(150,0,100,255)",
                focused:                "rgba(150,0,100,255)"
            },
            
            glow: {
                normal:                 "rgba(255,255,255,255)",
                hover:                  "rgba(255,255,255,255)",
                focused:                "rgba(255,255,255,255)"
            },
            
            font: {
                normal:                 "rgba(0,0,0,255)",
                hover:                  "rgba(0,0,0,255)",
                focused:                "rgba(0,0,0,255)"            
            },
            
            fontGlow: {
                normal:                 "rgba(255,255,255,255)",
                hover:                  "rgba(255,255,255,255)",
                focused:                "rgba(255,255,255,255)"
            }
        },
        
        // Connections
        positiveEdge: {
            line: {
                normal:                 "rgba(0,0,0,255)",
                hover:                  "rgba(0,0,0,255)",
                focused:                "rgba(0,0,0,255)"
            },
            
            glow: {
                normal:                 "rgba(0,0,0,255)",
                hover:                  "rgba(0,255,0,255)",
                focused:                "rgba(0,255,0,255)"
            }
        },
        
        negativeEdge: {
            line: {
                normal:                 "rgba(0,0,0,255)",
                hover:                  "rgba(0,0,0,255)",
                focused:                "rgba(0,0,0,255)"
            },
            
            glow: {
                normal:                 "rgba(0,0,0,255)",
                hover:                  "rgba(255,0,0,255)",
                focused:                "rgba(255,0,0,255)"
            }
        }        
    },
    
    // Monochrome theme for black-and-white printing and colour-blind accessibility
    MONOCHROME: {
        themeName:                      "Monochrome Theme",
        
        nodeFontFamily:                 "Verdana",
        nodeFontSize:                   "14px",
        nodeFontLineHeight:             "20px",
        nodeGlowDirX:                   "1px",
        nodeGlowDirY:                   "1px",
        nodeGlowSize:                   "1px",
        nodeFontGlowDirX:               "1px",
        nodeFontGlowDirY:               "1px",
        nodeFontGlowSize:               "1px",
        nodeSelectionHandles:           "rgba(92,92,92,255)",
        
        edgeGlowSize:                   "5px",
        
        positiveNode: {
            fill: {
                normal:                 "rgba(255,255,255,255)",
                hover:                  "rgba(245,245,245,255)",
                focused:                "rgba(245,245,245,255)"
            },
            
            line: {
                normal:                 "rgba(0,0,0,255)",
                hover:                  "rgba(0,0,0,255)",
                focused:                "rgba(0,0,0,255)"
            },
            
            glow: {
                normal:                 "rgba(255,255,255,255)",
                hover:                  "rgba(255,255,255,255)",
                focused:                "rgba(255,255,255,255)"
            },
            
            font: {
                normal:                 "rgba(0,0,0,255)",
                hover:                  "rgba(0,0,0,255)",
                focused:                "rgba(0,0,0,255)"
            },
            
            fontGlow: {
                normal:                 "rgba(255,255,255,255)",
                hover:                  "rgba(255,255,255,255)",
                focused:                "rgba(255,255,255,255)"
            }
        },
        
        neutralNode: {
            fill: {
                normal:                 "rgba(255,255,255,255)",
                hover:                  "rgba(245,245,245,255)",
                focused:                "rgba(245,245,245,255)"
            },
            
            line: {
                normal:                 "rgba(0,0,0,255)",
                hover:                  "rgba(0,0,0,255)",
                focused:                "rgba(0,0,0,255)"
            },
            
            glow: {                
                normal:                 "rgba(255,255,255,255)",
                hover:                  "rgba(255,255,255,255)",
                focused:                "rgba(255,255,255,255)"
            },
            
            font: {
                normal:                 "rgba(0,0,0,255)",
                hover:                  "rgba(0,0,0,255)",
                focused:                "rgba(0,0,0,255)"
            },
            
            fontGlow: {
                normal:                 "rgba(255,255,255,255)",
                hover:                  "rgba(255,255,255,255)",
                focused:                "rgba(255,255,255,255)"
            }
        },
        
        negativeNode: {
            fill: {
                normal:                 "rgba(255,255,255,255)",
                hover:                  "rgba(245,245,245,255)",
                focused:                "rgba(245,245,245,255)"
            },
            
            line: {
                normal:                 "rgba(0,0,0,255)",
                hover:                  "rgba(0,0,0,255)",
                focused:                "rgba(0,0,0,255)"            
            },
            
            glow: {
                normal:                 "rgba(255,255,255,255)",
                hover:                  "rgba(255,255,255,255)",
                focused:                "rgba(255,255,255,255)"
            },
            
            font: {
                normal:                 "rgba(0,0,0,255)",
                hover:                  "rgba(0,0,0,255)",
                focused:                "rgba(0,0,0,255)"
            },
            
            fontGlow: {
                normal:                 "rgba(255,255,255,255)",
                hover:                  "rgba(255,255,255,255)",
                focused:                "rgba(255,255,255,255)"
            }
        },
        
        ambivalentNode: {
            fill: {
                normal:                 "rgba(255,255,255,255)",
                hover:                  "rgba(245,245,245,255)",
                focused:                "rgba(245,245,245,255)"
            },
            
            line: {
                normal:                 "rgba(0,0,0,255)",
                hover:                  "rgba(0,0,0,255)",
                focused:                "rgba(0,0,0,255)"
            },
            
            glow: {
                normal:                 "rgba(255,255,255,255)",
                hover:                  "rgba(255,255,255,255)",
                focused:                "rgba(255,255,255,255)"
            },
            
            font: {
                normal:                 "rgba(0,0,0,255)",
                hover:                  "rgba(0,0,0,255)",
                focused:                "rgba(0,0,0,255)"            
            },
            
            fontGlow: {
                normal:                 "rgba(255,255,255,255)",
                hover:                  "rgba(255,255,255,255)",
                focused:                "rgba(255,255,255,255)"
            }
        },
        
        // Connections        
        positiveEdge: {
            line: {
                normal:                 "rgba(0,0,0,255)",
                hover:                  "rgba(0,0,0,255)",
                focused:                "rgba(0,0,0,255)"
            },
            
            glow: {
                normal:                 "rgba(0,0,0,255)",
                hover:                  "rgba(0,0,230,255)",
                focused:                "rgba(0,0,230,255)"
            }
        },
        
        negativeEdge: {
            line: {
                normal:                 "rgba(0,0,0,255)",
                hover:                  "rgba(0,0,0,255)",
                focused:                "rgba(0,0,0,255)"
            },
            
            glow: {
                normal:                 "rgba(0,0,0,255)",
                hover:                  "rgba(0,0,230,255)",
                focused:                "rgba(0,0,230,255)"
            }
        }
    },
    
    // An alternative color scheme
    ALTERNATIVE: {
        themeName:                      "Alternative Colour",
        
        nodeFontFamily:                 "'Lucida Sans Unicode', 'Lucida Grande', Verdana, sans-serif",
        nodeFontSize:                   "14px",
        nodeFontLineHeight:             "20px",
        nodeGlowDirX:                   "1px",
        nodeGlowDirY:                   "1px",
        nodeGlowSize:                   "1px",
        nodeFontGlowDirX:               "1px",
        nodeFontGlowDirY:               "1px",
        nodeFontGlowSize:               "1px",
        nodeSelectionHandles:           "rgba(51,51,51,255)",
        
        edgeGlowSize:                   "5px",
        
        positiveNode: {
            fill: {
                normal:                 "rgba(255,255,255,255)",
                hover:                  "rgba(255,255,255,255)",
                focused:                "rgba(255,255,255,255)"
            },
            
            line: {
                normal:                 "rgba(28,175,33,255)",
                hover:                  "rgba(0,255,0,255)",
                focused:                "rgba(0,255,0,255)"
            },
            
            glow: {
                normal:                 "rgba(255,255,255,255)",
                hover:                  "rgba(255,255,255,255)",
                focused:                "rgba(255,255,255,255)"
            },
            
            font: {
                normal:                 "rgba(51,51,51,255)",
                hover:                  "rgba(0,0,0,255)",
                focused:                "rgba(0,0,0,255)"
            },
            
            fontGlow: {
                normal:                 "rgba(255,255,255,255)",
                hover:                  "rgba(255,255,255,255)",
                focused:                "rgba(255,255,255,255)"
            }
        },
        
        neutralNode: {
            fill: {
                normal:                 "rgba(255,255,255,255)",
                hover:                  "rgba(255,255,255,255)",
                focused:                "rgba(255,255,255,255)"
            },
            
            line: {
                normal:                 "rgba(233,215,19,255)",
                hover:                  "rgba(255,255,0,255)",
                focused:                "rgba(255,255,0,255)"
            },
            
            glow: {
                normal:                 "rgba(255,255,255,255)",
                hover:                  "rgba(255,255,255,255)",
                focused:                "rgba(255,255,255,255)"
            },
            
            font: {
                normal:                 "rgba(51,51,51,255)",
                hover:                  "rgba(0,0,0,255)",
                focused:                "rgba(0,0,0,255)"
            },
            
            fontGlow: {
                normal:                 "rgba(255,255,255,255)",
                hover:                  "rgba(255,255,255,255)",
                focused:                "rgba(255,255,255,255)"
            }
        },
        
        negativeNode: {
            fill: {
                normal:                 "rgba(255,255,255,255)",
                hover:                  "rgba(255,255,255,255)",
                focused:                "rgba(255,255,255,255)"
            },
            
            line: {
                normal:                 "rgba(179,32,32,255)",
                hover:                  "rgba(255,0,0,255)",
                focused:                "rgba(255,0,0,255)"
            },
            
            glow: {
                normal:                 "rgba(255,255,255,255)",
                hover:                  "rgba(255,255,255,255)",
                focused:                "rgba(255,255,255,255)"
            },
            
            font: {
                normal:                 "rgba(51,51,51,255)",
                hover:                  "rgba(0,0,0,255)",
                focused:                "rgba(0,0,0,255)"
            },
            
            fontGlow: {
                normal:                 "rgba(255,255,255,255)",
                hover:                  "rgba(255,255,255,255)",
                focused:                "rgba(255,255,255,255)"
            }
        },
        
        ambivalentNode: {
            fill: {
                normal:                 "rgba(255,255,255,255)",
                hover:                  "rgba(255,255,255,255)",
                focused:                "rgba(255,255,255,255)"
            },
            
            line: {
                normal:                 "rgba(85,0,50,255)",
                hover:                  "rgba(85,0,50,255)",
                focused:                "rgba(85,0,50,255)"
            },
            
            glow: {
                normal:                 "rgba(255,255,255,255)",
                hover:                  "rgba(255,255,255,255)",
                focused:                "rgba(255,255,255,255)"
            },
            
            font: {
                normal:                 "rgba(0,0,0,255)",
                hover:                  "rgba(0,0,0,255)",
                focused:                "rgba(0,0,0,255)"            
            },
            
            fontGlow: {
                normal:                 "rgba(255,255,255,255)",
                hover:                  "rgba(255,255,255,255)",
                focused:                "rgba(255,255,255,255)"
            }
        },
         
        // Connections        
        positiveEdge: {
            line: {
                normal:                 "rgba(51,51,51,255)",
                hover:                  "rgba(0,0,0,255)",
                focused:                "rgba(0,0,0,255)"
            },
            
            glow: {
                normal:                 "rgba(51,51,51,255)",
                hover:                  "rgba(0,0,0,255)",
                focused:                "rgba(0,0,0,255)"
            }
        },
        
        negativeEdge: {
            line: {
                normal:                 "rgba(0,0,0,255)",
                hover:                  "rgba(0,255,0,255)",
                focused:                "rgba(0,255,0,255)"
            },
            
            glow: {
                normal:                 "rgba(0,0,0,255)",
                hover:                  "rgba(255,0,0,255)",
                focused:                "rgba(255,0,0,255)"
            }
        }        
    }
};