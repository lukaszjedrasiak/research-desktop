export default class wcCanvas extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.computedStyle = getComputedStyle(document.documentElement);
        this.vertices = [];
        this.edges = [];

        this.resizeTimer = null;
        this.resizeDelay = 100;

    }

    async connectedCallback() {
        await this.initialize();
        await this.loadData();
        await this.drawGraph();
        await this.attachEventListeners();
    }

    async disconnectedCallback() {
        this.detachEventListeners();
    }

    async initialize() {
        // template + styles
        try {
            await this.fetchStyle();
            const content = await this.fetchTemplate();
            this.shadowRoot.innerHTML = '';
            this.shadowRoot.appendChild(content);
        } catch (error) {
            console.error('Error rendering template:', error);
        }

        // fonts
        try {
            await Promise.all([
                document.fonts.load('24px "Material Symbols Outlined"'),
                document.fonts.load('24px "Material Symbols Rounded"'),
                document.fonts.load('24px "Material Symbols Sharp"')
            ]);
        } catch (err) {
            console.error('Error loading Material Symbols fonts:', err);
            throw err; // Re-throw to prevent graph from rendering without fonts
        }

        // canvas setup
        this.canvasElement = this.shadowRoot.querySelector('canvas');
        this.canvasElementParent = this.getRootNode().host || this;
        this.ctx = this.canvasElement.getContext('2d');

        const rect = this.canvasElementParent.getBoundingClientRect();
        this.canvasElement.width = rect.width;
        this.canvasElement.height = rect.height;

        this.startX = 0;
        this.startY = 0;
        this.offset = {
            x: this.canvasElement.width / 2,
            y: this.canvasElement.height / 2
        };
        this.scale = this.scale || 1;
        this.scaleFactor = 1.1;
        this.cursorMode = 'default';
    }

    async loadData() {
        try {
            this.graph = await window.api_internal.getGraphData();
            this.currentLanguage = this.graph.languages.default;
            this.vertices = await window.api_internal.getVertices();
            this.edges = await window.api_internal.getEdges();
        } catch(error) {
            console.error('Error fetching data:', error);
        }
    }

    async drawGrid() {
        // Get the visible area in the original coordinate system (before transform)
        const gridSpacing = 100; // Distance between grid dots
        const dotRadius = 0.5; // Size of each dot
        
        // Calculate the visible area boundaries in the original coordinate system
        const visibleLeft = (-this.offset.x) / this.scale;
        const visibleRight = (this.canvasElement.width - this.offset.x) / this.scale;
        const visibleTop = (-this.offset.y) / this.scale;
        const visibleBottom = (this.canvasElement.height - this.offset.y) / this.scale;
        
        // Calculate grid start/end points based on visible area
        const startX = Math.floor(visibleLeft / gridSpacing) * gridSpacing;
        const endX = Math.ceil(visibleRight / gridSpacing) * gridSpacing;
        const startY = Math.floor(visibleTop / gridSpacing) * gridSpacing;
        const endY = Math.ceil(visibleBottom / gridSpacing) * gridSpacing;
        
        // Draw origin crosshair
        this.ctx.beginPath();
        this.ctx.moveTo(-16, 0);
        this.ctx.lineTo(16, 0);
        this.ctx.moveTo(0, -16);
        this.ctx.lineTo(0, 16);
        this.ctx.lineWidth = 0.5;
        this.ctx.strokeStyle = this.computedStyle.getPropertyValue('--warning');
        this.ctx.stroke();
        
        // Draw grid dots
        if (this.scale < 0.5) return;

        this.ctx.fillStyle = this.computedStyle.getPropertyValue('--border');
        
        for (let x = startX; x <= endX; x += gridSpacing) {
            for (let y = startY; y <= endY; y += gridSpacing) {
                // Skip the origin as it already has the crosshair
                if (x === 0 && y === 0) continue;
                
                this.ctx.beginPath();
                this.ctx.arc(x, y, dotRadius, 0, 2 * Math.PI);
                this.ctx.fill();
            }
        }
    }

    async drawVertices(vertices) {

        vertices.forEach(async vertex => {
            //await this.drawIcon(vertex._canvas, vertex._canvas.selected);
            await this.drawIcon(vertex);
        });
    }

    async drawEdges(edges) {
        edges.forEach(edge => {
            const from = this.vertices.find(v => v._uuid === edge._from);
            const to = this.vertices.find(v => v._uuid === edge._to);

            if (!from || !to) return;

            let currentColor = this.computedStyle.getPropertyValue(edge._canvas.color);
                
            if (edge._label === 'parent' && from._canvas.selected) {
                currentColor = this.computedStyle.getPropertyValue('--tertiary');
            }

            if (edge._label === 'sibling' && (from._canvas.selected || to._canvas.selected)) {
                currentColor = this.computedStyle.getPropertyValue('--tertiary');
            }

            this.ctx.beginPath();
            
            // Set line style based on edge type
            if (edge._label === 'sibling') {
                this.ctx.setLineDash([5, 5]); // Creates a dashed line pattern
            } else {
                this.ctx.setLineDash([]); // Solid line
            }

            this.ctx.moveTo(from._canvas.x, from._canvas.y);
            this.ctx.lineTo(to._canvas.x, to._canvas.y);
            this.ctx.strokeStyle = currentColor;
            this.ctx.lineWidth = edge._canvas.width;
            this.ctx.stroke();
            
            // Reset line dash to prevent affecting other drawings
            this.ctx.setLineDash([]);
            
            if (edge._label === 'parent') {
                this.drawArrows(from, to, currentColor, edge._canvas.width);
            }
        });
    }

    async drawArrows(from, to, color, width) {
        const arrowLength = 10;
        const angle = Math.PI / 6;

        // calculate direction from 'from' to 'to'
        const dx = to._canvas.x - from._canvas.x;
        const dy = to._canvas.y - from._canvas.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // normalize the direction vector
        const directionX = dx / distance;
        const directionY = dy / distance;

        // calculate the end of the edge adjusted to be at the edge of the 'to' circle
        const adjustedToX = to._canvas.x - directionX * (to._canvas.size * 1.125);
        const adjustedToY = to._canvas.y - directionY * (to._canvas.size * 1.125);

        // calculate the position for the arrowhead
        const arrowX = adjustedToX;
        const arrowY = adjustedToY;

        // calculate points for the two sides of the arrowhead
        const leftX = arrowX - arrowLength * (directionX * Math.cos(angle) - directionY * Math.sin(angle));
        const leftY = arrowY - arrowLength * (directionY * Math.cos(angle) + directionX * Math.sin(angle));
        const rightX = arrowX - arrowLength * (directionX * Math.cos(-angle) - directionY * Math.sin(-angle));
        const rightY = arrowY - arrowLength * (directionY * Math.cos(-angle) + directionX * Math.sin(-angle));

        // draw the arrowhead
        this.ctx.beginPath();
        this.ctx.moveTo(arrowX, arrowY);
        this.ctx.lineTo(leftX, leftY);
        this.ctx.moveTo(arrowX, arrowY);
        this.ctx.lineTo(rightX, rightY);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.stroke();
    }

    async drawLabels(vertices) {

        vertices.forEach(vertex => {
            let title = vertex._title[this.currentLanguage];
            const iconSize = 
                vertex._canvas.size ?? 
                this.graph.vertices.default[vertex._type]?.size ?? 
                16;

            if (!vertex._canvas.selected) {
                title = title.length > 16 ? title.slice(0, 16).trim() + '…' : title;
                this.ctx.fillStyle = this.computedStyle.getPropertyValue('--muted');
            } else {
                this.ctx.fillStyle = this.computedStyle.getPropertyValue('--font');
            }
            const fontSize = 14;
            this.ctx.font = `${fontSize}px monospace`;

            const textWidth = Math.floor(this.ctx.measureText(title).width);
            const textX = vertex._canvas.x - textWidth / 2;
            const textY = vertex._canvas.y + iconSize + fontSize * 1.5;
            this.ctx.fillText(title, textX, textY);
        });
    }

    async drawGraph() {
        this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        this.ctx.save();
        this.ctx.translate(this.offset.x, this.offset.y);
        this.ctx.scale(this.scale, this.scale);
        this.drawGrid();
        this.drawEdges(this.edges);
        this.drawVertices(this.vertices);
        this.drawLabels(this.vertices);
        this.ctx.restore();
    }

    async drawIcon(vertex) {
        //console.log(`drawIcon for vertex: ${vertex._uuid}`);

        // set properties
        const vertexType = vertex._type;

        const iconLibrary = 
            vertex._canvas.library ?? 
            this.graph.vertices.default[vertexType]?.library ?? 
            'material-symbols-rounded';
        const iconCode = 
            vertex._canvas.icon ?? 
            this.graph.vertices.default[vertexType]?.icon ?? 
            'error';
        const iconSize = 
            vertex._canvas.size ?? 
            this.graph.vertices.default[vertexType]?.size ?? 
            16;
        const iconFill = this.computedStyle.getPropertyValue(
            vertex._canvas.fill ?? 
            this.graph.vertices.default[vertexType]?.fill ?? 
            '--warning'
        );
        const iconStroke = this.computedStyle.getPropertyValue(
            vertex._canvas.stroke ??
            this.graph.vertices.default[vertexType]?.stroke ??
            null
        ); 
        let backgroundColor;

        switch(vertex._canvas.selected) {
            case true:
                backgroundColor = this.computedStyle.getPropertyValue('--container');
                break;
            default:
                backgroundColor = this.computedStyle.getPropertyValue('--background');
                break;
        }

        switch (iconLibrary) {
            case 'material-symbols-outlined':
                this.ctx.font = `normal normal 200 ${iconSize * 2}px "Material Symbols Outlined"`;
                break;
            case 'material-symbols-rounded':
                this.ctx.font = `normal normal 200 ${iconSize * 2}px "Material Symbols Rounded"`;
                break;
            case 'material-symbols-sharp':
                this.ctx.font = `normal normal 200 ${iconSize * 2}px "Material Symbols Sharp"`;
                break;
        }

        // save context
        this.ctx.save();

        // draw background
        this.ctx.beginPath();
        this.ctx.arc(vertex._canvas.x, vertex._canvas.y, iconSize * 1.125, 0, 2 * Math.PI);
        this.ctx.fillStyle = backgroundColor;
        this.ctx.fill();

        // draw icon
        this.ctx.fillStyle = iconFill;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(iconCode, vertex._canvas.x, vertex._canvas.y + 2.5);

        // restore context
        this.ctx.restore();
    }
   
    zoom(event) {
        //if (!event.ctrlKey) return;
        event.preventDefault();

        const mouseX = event.clientX - this.canvasElement.getBoundingClientRect().left;
        const mouseY = event.clientY - this.canvasElement.getBoundingClientRect().top;

        const zoomIn = event.deltaY < 0;
        const previousScale = this.scale;

        if (zoomIn) {
            this.scale *= this.scaleFactor;
        } else {
            this.scale /= this.scaleFactor;
        }

        const scaleRatio = this.scale / previousScale;

        this.offset.x = mouseX - (mouseX - this.offset.x) * scaleRatio;
        this.offset.y = mouseY - (mouseY - this.offset.y) * scaleRatio;

        this.scale = this.scale;
        this.offset.x = this.offset.x;
        this.offset.y = this.offset.y;

        this.drawGraph();
        //console.log(`%c scale: ${this.scale}`, 'color: lightblue');
    }

    mouseDown(event) {
        switch (event.button) {
            // left mouse button
            case 0:
                const {originalX, originalY} = this.getCartesianCoordinates(event);

                for (const vertex of this.vertices) {
                    const iconSize = 
                        vertex._canvas.size ?? 
                        this.graph.vertices.default[vertex._type]?.size ?? 
                        16;
                    const dx = originalX - vertex._canvas.x;
                    const dy = originalY - vertex._canvas.y;
        
                    if (dx * dx + dy * dy < iconSize * iconSize) {
                        if (!vertex._canvas.selected) {
                            this.vertices.forEach(v => v._canvas.selected = false);
                            vertex._canvas.selected = true;
                        }
                        break;
                    } else {
                        this.vertices.forEach(v => v._canvas.selected = false);
                    }
                }

                // redraw canvas after the loop
                this.drawGraph();
                break;

            // middle mouse button
            case 1:
                //console.log(`%ccanvas.mouseDown(${event.button})`, 'color: green');
                event.preventDefault();
                this.cursorMode = 'pan';
                this.startX = event.clientX;
                this.startY = event.clientY;
                this.canvasElement.style.cursor = 'grabbing';
                break;
        }
    }

    async mouseUp(event) {
        switch (event.button) {
            // middle mouse button
            case 1:
                this.cursorMode = 'default';
                this.canvasElement.style.cursor = 'auto';
                break;
        }
    }

    mouseMove(event) {
        if (this.cursorMode === 'pan') {
            // 1. Calculate the distance moved since last position
            let deltaX = event.clientX - this.startX;  // How far mouse moved horizontally
            let deltaY = event.clientY - this.startY;  // How far mouse moved vertically

            // 2. Update the canvas offset by adding the movement distance
            this.offset.x = this.offset.x + deltaX;
            this.offset.y = this.offset.y + deltaY;

            // 3. Store current position as the new reference point
            this.startX = event.clientX;
            this.startY = event.clientY;

            // 4. Redraw the canvas with new offset
            this.drawGraph();
        }
    }

    async dblClick(event) {
        event.preventDefault();
        const {originalX, originalY} = this.getCartesianCoordinates(event);

        switch (event.button) {
            case 0:
                let vertexFound = false;
                // check if the click is near a vertex
                for (const vertex of this.vertices) {
                    const iconSize = 
                        vertex._canvas.size ?? 
                        this.graph.vertices.default[vertex._type]?.size ?? 
                        16;
                    const dx = originalX - vertex._canvas.x;
                    const dy = originalY - vertex._canvas.y;

                    if (dx * dx + dy * dy < iconSize * iconSize) {
                        const vertexPreview = document.querySelector('wc-vertex-preview');
                        vertexPreview.showDialog(vertex);
                        vertexFound = true;
                        break;
                    }
                }

                if (!vertexFound) {
                    await window.api_internal.vertexCreate(originalX, originalY);
                }
        }
    }

    async attachEventListeners() {
        //console.log(`%c -> ViewCanvas | attachEventListeners`, 'color: lightblue');

        // Add these style properties to prevent text selection
        this.canvasElement.style.userSelect = 'none';
        this.canvasElement.style.webkitUserSelect = 'none';
        this.canvasElement.style.msUserSelect = 'none';

        this.boundZoom = this.zoom.bind(this);
        this.boundMouseDown = this.mouseDown.bind(this);
        this.boundMouseUp = this.mouseUp.bind(this);
        this.boundMouseMove = this.mouseMove.bind(this);
        this.boundDblClick = this.dblClick.bind(this);
        this.boundResizeCanvas = this.resizeCanvas.bind(this);

        this.canvasElement.addEventListener('wheel', this.boundZoom);
        this.canvasElement.addEventListener('mousedown', this.boundMouseDown);
        this.canvasElement.addEventListener('mouseup', this.boundMouseUp);
        this.canvasElement.addEventListener('mousemove', this.boundMouseMove);
        this.canvasElement.addEventListener('dblclick', this.boundDblClick);

        window.addEventListener('resize', this.boundResizeCanvas);
    }

    async detachEventListeners() {
        //console.log(`%c -> ViewCanvas | detachEventListeners`, 'color: lightblue');

        this.canvasElement.removeEventListener('wheel', this.boundZoom);
        this.canvasElement.removeEventListener('mousedown', this.boundMouseDown);
        this.canvasElement.removeEventListener('mouseup', this.boundMouseUp);
        this.canvasElement.removeEventListener('mousemove', this.boundMouseMove);
        this.canvasElement.removeEventListener('dblclick', this.boundDblClick);

        window.removeEventListener('resize', this.boundResizeCanvas);
    }

    async fetchStyle() {
        try {
            const styleResponse = await fetch(`../../renderer/components/${this.constructor.name}/style.css`);
            const styleText = await styleResponse.text();
            const styleSheet = new CSSStyleSheet();
            await styleSheet.replace(styleText);
            
            if (this.shadowRoot) {
                this.shadowRoot.adoptedStyleSheets = [styleSheet];
            }
            
            return styleSheet;
        } catch (error) {
            console.error('Error fetching component style:', error);
            throw error;
        }
    }
    
    async fetchTemplate() {
        try {
            const response = await fetch(`../../renderer/components/${this.constructor.name}/template.html`);
            const templateText = await response.text();
            //console.log('Fetched template text:', templateText);
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(templateText, 'text/html');
            const template = doc.querySelector('template');
            
            if (!template) {
                console.warn('No template found in response');
                return null;
            }
            
            const content = template.content.cloneNode(true);
            //console.log('Cloned template content:', content);
            return content;
        } catch (error) {
            console.error('Error fetching component template:', error);
            throw error;
        }
    }

    getCartesianCoordinates(event) {
        const mouseX = event.clientX - this.canvasElement.getBoundingClientRect().left;
        const mouseY = event.clientY - this.canvasElement.getBoundingClientRect().top;
        
        const originalX = Math.round((mouseX - this.offset.x) / this.scale);
        const originalY = Math.round((mouseY - this.offset.y) / this.scale);

        return { originalX, originalY };
    }

    resizeCanvas() {
        clearTimeout(this.resizeTimer);

        this.resizeTimer = setTimeout(() => {
            const rect = this.canvasElementParent.getBoundingClientRect();
            this.canvasElement.width = rect.width;
            this.canvasElement.height = rect.height;

            this.offset = {
                x: this.canvasElement.width / 2,
                y: this.canvasElement.height / 2
            };

            this.drawGraph();
        }, this.resizeDelay);
    }
}

customElements.define('wc-canvas', wcCanvas);