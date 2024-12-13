const pixelWidth = 32;
const pixelHeight = 32;
const width = pixelWidth * 10;
const height = pixelHeight * 10;
let pixelData = [];
let pixelEditorState = {
    color: [0, 0, 0, 1],
    active: false,
    currentTool: "pencil"
};
let steps = [];
let editorCanvas = null;
let editorContext = null;
let refCanvas = null;
let refImage = "img/cursor-guy-smile.png"

const initPixelEditor = () => {
    editorCanvas = document.querySelector("#pixelEditorCanvas");
    editorCanvas.width = width;
    editorCanvas.height = height;
    editorContext = editorCanvas.getContext("2d");
    initContext(editorContext, width, height);
    initColorSelectorStampEditor();
    updateToolCursor()

    refCanvas = document.getElementById('pixelEditorReferenceCanvas');
    refContext = refCanvas.getContext('2d');

    if (KiddoPaint.Submenu.selectedSprite !== null) {
        base_image = new Image();
        if (KiddoPaint.Submenu.selectedSprite.custom !== true) {
            base_image.src = KiddoPaint.Submenu.selectedSprite.spriteSheet;
            base_image.onload = function() {
                const refImage = scaleImageDataCanvasAPIPixelated(extractSprite(base_image, 32, KiddoPaint.Submenu.selectedSprite.spriteCol, KiddoPaint.Submenu.selectedSprite.spriteRow, 0), 1)
                console.log(refImage);
                refContext.clearRect(0, 0, refCanvas.height, refCanvas.width)
                refContext.drawImage(refImage, 0, 0);
                loadFromImage()
                setcolor([0, 0, 0, 1], editorContext)
            }
        } else {
            base_image.src = KiddoPaint.Submenu.selectedSprite.imgSrc;
            base_image.onload = function() {
                const refImage = scaleImageDataCanvasAPIPixelated(base_image, 1)
                console.log(refImage);
                refContext.clearRect(0, 0, refCanvas.height, refCanvas.width)
                refContext.drawImage(refImage, 0, 0);
                loadFromImage()
                setcolor([0, 0, 0, 1], editorContext)
            }
        }
    }

    setcolor(pixelEditorState.color, editorContext);

    editorCanvas.addEventListener("mousemove", e => {
        //console.log(`Mouse moving, editor state: ${pixelEditorState.active}`)
        if (pixelEditorState.active) {
            var rect = editorCanvas.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;
            x = Math.floor(pixelWidth * x / editorCanvas.clientWidth);
            y = Math.floor(pixelHeight * y / editorCanvas.clientHeight);
            draw(x, y, editorContext);
        }
    });

    editorCanvas.addEventListener("touchmove", e => {
        var rect = editorCanvas.getBoundingClientRect();
        var x = e.touches[0].clientX - rect.left;
        var y = e.touches[0].clientY - rect.top;
        x = Math.floor(width * x / editorCanvas.clientWidth);
        y = Math.floor(height * y / editorCanvas.clientHeight);
        draw(x, y, editorContext);
    })

    editorCanvas.addEventListener("mousedown", e => {
        pixelEditorState.active = true;
        var rect = editorCanvas.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        x = Math.floor(pixelWidth * x / editorCanvas.clientWidth);
        y = Math.floor(pixelHeight * y / editorCanvas.clientHeight);
        if (pixelEditorState.currentTool == "pencil") {
            draw(x, y, editorContext)
        } else if (pixelEditorState.currentTool == "fill") {
            filler(x, y, pixelData[y][x])
        }
    });
    editorCanvas.addEventListener("mouseup", e => {
        pixelEditorState.active = false;
    });
};

const initContext = (editorContext, width, height) => {
    editorContext.fillStyle = 'white';
    editorContext.globalAlpha = 0.0;
    editorContext.fillRect(0, 0, width, height);
};

const pixelCanvasClick = (event, canvas, context) => {
    const canvasRect = canvas.getBoundingClientRect();
    const posX = event.clientX - canvasRect.left;
    const posY = event.clientY - canvasRect.top;
    const x = Math.floor((pixelWidth * posX) / canvas.clientWidth);
    const y = Math.floor((pixelHeight * posY) / canvas.pixelHeight);

    draw(x, y, context);
};

const draw = (x, y, editorContext) => {
    const color = pixelEditorState.color;
    if (x >= 0 && x < pixelWidth && y >= 0 && y < pixelHeight) {
        //console.log(`filling ${x} ${y} ${color}`)
        pixelData[y][x] = color;
        editorContext.fillRect(
            Math.floor(x * (width / pixelWidth)),
            Math.floor(y * (height / pixelHeight)),
            Math.floor(width / pixelWidth),
            Math.floor(height / pixelHeight)
        );
        if (
            JSON.stringify(steps[steps.length - 1]) !==
            JSON.stringify([x, y, color, editorContext.globalAlpha])
        ) {
            steps.push([x, y, color, editorContext.globalAlpha]);
        }
    }
};

const filler = (x, y, cc) => {
    if (x >= 0 && x < pixelWidth && y >= 0 && y < pixelHeight) {
        if (
            JSON.stringify(pixelData[y][x]) == JSON.stringify(cc) &&
            JSON.stringify(pixelData[y][x]) != JSON.stringify(pixelEditorState.color)
        ) {
            draw(x, y, editorContext);
            filler(x + 1, y, cc);
            filler(x, y + 1, cc);
            filler(x - 1, y, cc);
            filler(x, y - 1, cc);
        }
    }
}

const loadFromImage = () => {
    const pixel = refContext.getImageData(0, 0, pixelWidth, pixelHeight);
    const data = pixel.data;
    const allPixels = [];
    const chunkSize = 4

    for (let i = 0; i < data.length; i += chunkSize) {
        const pixelVal = data.slice(i, i + chunkSize);
        allPixels.push(pixelVal)
    }

    //console.log(allPixels)

    const newArray = [...Array(pixelWidth)].map((_) =>
        allPixels.splice(0, pixelHeight)
    );

    //rotate90Clockwise(newArray)
    //console.log(pixelData)
    pixelData = blankCanvas()

    newArray.forEach((col, col_i) => {
        col.forEach((pixel, pixel_i) => {
            setcolor(pixel, editorContext)
            draw(pixel_i, col_i, editorContext)
        })
    })
}

const blankCanvas = () => {
    return [...Array(pixelWidth)].map((_) =>
        Array(pixelHeight).fill([255, 255, 255, 1])
    );
}

const parseRGBColor = (color) => {
    const colorValues = color.split("(")[1].split(")")[0].split(",").map(colVal => colVal.trim())
    return [...colorValues, 1]
}

const setcolor = (color, editorContext) => {
    editorContext.globalAlpha = 1;
    pixelEditorState.color = color;
    editorContext.fillStyle = "rgba(" + color[0] + "," + color[1] + "," + color[2] + "," + color[3] + ")";
}

const exitEditor = () => {
    let editorModal = document.getElementById("pixelEditorModal");
    editorModal.style.display = "none";
}

const showEditor = () => {
    let editorModal = document.getElementById("pixelEditorModal");
    editorModal.style.display = "block";
    initPixelEditor();
}

const getOriginalSprite = () => {
    if (KiddoPaint.Submenu.selectedSprite.custom == true) {
        return KiddoPaint.Submenu.selectedSprite.originalSprite
    } else {
        return KiddoPaint.Submenu.selectedSprite
    }
}

const exportCustomStamp = () => {
    const scaledImage = scaleImageDataCanvasAPIPixelated(editorCanvas, 0.2)
    const thumbCanvas = scaleImageDataCanvasAPIPixelated(editorCanvas, 0.1)
    const originalSprite = getOriginalSprite()

    let individualSprite = {
        name: 'Sprite',
        custom: true,
        imgSrc: thumbCanvas.toDataURL("image/png"),
        originalSprite: originalSprite,
        handler: function(e) {
            var img = new Image()
            KiddoPaint.Submenu.selectedSprite = individualSprite;
            img.src = scaledImage.toDataURL("image/png");
            img.crossOrigin = 'anonymous';
            img.onload = function() {
                KiddoPaint.Tools.SpritePlacer.image = scaledImage;
                KiddoPaint.Tools.SpritePlacer.soundBefore = function() {
                    KiddoPaint.Sounds.stamp();
                };
                KiddoPaint.Tools.SpritePlacer.soundDuring = function() {};
                KiddoPaint.Current.tool = KiddoPaint.Tools.SpritePlacer;
            };
        }
    }

    const spriteKey = `${originalSprite.spriteSheet}-${originalSprite.spriteCol}-${originalSprite.spriteRow}`
    KiddoPaint.Submenu.customSprites[spriteKey] = individualSprite;
    KiddoPaint.Tools.SpritePlacer.image = scaledImage;
    init_sprites_submenu();
    show_generic_submenu('sprites');
    exitEditor();
}

function colorSelectStampEditor(e) {
    KiddoPaint.Sounds.submenucolor();
    var src = e.srcElement || e.target;
    var colorId = src.id;
    const colorIndex = colorId.split("-")[1]
    var colorSelected = KiddoPaint.Colors.currentPalette()[colorIndex];
    if (e.which == 1) {
        KiddoPaint.Current.color = colorSelected
        document.getElementById('currentColorStampEditor').style = "background-color:" + colorSelected;
        setcolor(parseRGBColor(colorSelected), editorContext)
    } else if (e.which == 3) {
        KiddoPaint.Current.altColor = colorSelected;
    } else if (e.which == 2) {
        KiddoPaint.Current.terColor = colorSelected;
    }
}

function setColorsToCurrentPaletteStampEditor() {
    var pal = KiddoPaint.Colors.currentPalette();
    var buttons = document.getElementById('colorselectorStampEditor').children;
    for (var i = 0, len = buttons.length; i < len; i++) {
        var button = buttons[i];
        var color = pal[i];
        button.style = "background-color:" + color;
    }
}

const rotate90ClockwiseBtn = () => {
    pixelData = rotate90Clockwise(pixelData)
    editorContext.clearRect(0, 0, height, width)
    pixelData.forEach((col, col_i) => {
        col.forEach((pixel, pixel_i) => {
            setcolor(pixel, editorContext)
            draw(pixel_i, col_i, editorContext)
        })
    })
}

const rotateVerticalFlipBtn = () => {
    pixelData = flipVertical(pixelData)
    editorContext.clearRect(0, 0, height, width)
    pixelData.forEach((col, col_i) => {
        col.forEach((pixel, pixel_i) => {
            setcolor(pixel, editorContext)
            draw(pixel_i, col_i, editorContext)
        })
    })
}

const rotateHorizontalFlipBtn = () => {
    pixelData = flipHorizontal(pixelData)
    editorContext.clearRect(0, 0, height, width)
    pixelData.forEach((col, col_i) => {
        col.forEach((pixel, pixel_i) => {
            setcolor(pixel, editorContext)
            draw(pixel_i, col_i, editorContext)
        })
    })
}

const rotate90Clockwise = matrix => {
    if (!matrix.length) return null;
    if (matrix.length === 1) return matrix;
    transpose(matrix);
    matrix.forEach((row) => {
        reverse(row, 0, row.length - 1);
    });
    return matrix
}

function flipHorizontal(pixelData) {
    // reverse all columns
    return pixelData.map(row => {
        return row.reverse()
    })

}

function flipVertical(pixelData) {
    // reverse all rows
    let pixelDataHorizontal = pixelData.reverse()

    return pixelDataHorizontal

}

function transpose(matrix) {
    for (let i = 0; i < matrix.length; i++) {
        for (let j = i; j < matrix[0].length; j++) {
            const temp = matrix[i][j];
            matrix[i][j] = matrix[j][i];
            matrix[j][i] = temp;
        }
    }
    return matrix;
}

function reverse(row, start, end) {
    while (start < end) {
        const temp = row[start];
        row[start] = row[end];
        row[end] = temp;
        start++;
        end--;
    }
    return row;
}

function restoreOriginalStamp() {
    const baseImage = new Image();
    const originalSprite = KiddoPaint.Submenu.selectedSprite.custom !== true ? KiddoPaint.Submenu.selectedSprite : KiddoPaint.Submenu.selectedSprite.originalSprite;
    baseImage.src = originalSprite.spriteSheet

    baseImage.onload = function() {
        const refImage = scaleImageDataCanvasAPIPixelated(extractSprite(baseImage, 32, originalSprite.spriteCol, originalSprite.spriteRow, 0), 1)
        editorContext.clearRect(0, 0, height, width)
        refContext.clearRect(0, 0, refCanvas.height, refCanvas.width)
        refContext.drawImage(refImage, 0, 0);
        loadFromImage()
    }
}

function initColorSelectorStampEditor() {
    var buttons = document.getElementById('colorselectorStampEditor').children;
    for (var i = 0, len = buttons.length; i < len; i++) {
        var button = buttons[i];
        button.id = `colorStampEditor-${i}`;
        button.addEventListener('mousedown', colorSelectStampEditor);
    }
    setColorsToCurrentPaletteStampEditor();
    document.getElementById('currentColorStampEditor').style = "background-color:" + KiddoPaint.Current.color;
    init_color_paging();
}

function initColorPagingStampEditor() {
    document.getElementById('colorprevStampEditor').addEventListener('mousedown', function() {
        KiddoPaint.Sounds.submenucolor();
        KiddoPaint.Colors.prevPalette();
        set_colors_to_current_palette();
    });
    document.getElementById('colornextStampEditor').addEventListener('mousedown', function() {
        KiddoPaint.Sounds.submenucolor();
        KiddoPaint.Colors.nextPalette();
        set_colors_to_current_palette();
    });
}

function setCurrentTool(toolName) {
    pixelEditorState.currentTool = toolName
    updateToolCursor()
}

function updateToolCursor() {
    editorCanvas.classList = "";
    switch (pixelEditorState.currentTool) {
        case "pencil":
            editorCanvas.classList.add('cursor-pencil');
            break;
        case "fill":
            editorCanvas.classList.add('cursor-bucket');
            break;
    }
}