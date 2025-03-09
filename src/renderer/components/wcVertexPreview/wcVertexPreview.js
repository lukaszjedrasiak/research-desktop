export default class wcVertexPreview extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    async connectedCallback() {
        console.log(`%c # connectedCallback()`, 'color: lightblue');
        await this.initialize();
        await this.attachEventListeners();
    }

    async disconnectedCallback() {
        console.log(`%c # disconnectedCallback()`, 'color: lightblue');
        await this.detachEventListeners();
    }

    async attachEventListeners() {
        this.boundCloseDialog = this.closeDialog.bind(this);
        
        this.shadowRoot.querySelector('#close').addEventListener('click', this.boundCloseDialog);
    }

    async detachEventListeners() {
        this.shadowRoot.querySelector('#close').removeEventListener('click', this.boundCloseDialog);
    }

    async initialize() {
        try {
            await this.fetchStyle();
            const content = await this.fetchTemplate();
            this.shadowRoot.innerHTML = '';
            this.shadowRoot.appendChild(content);
            this.dialog = this.shadowRoot.querySelector('dialog');
        } catch (error) {
            console.error('Error rendering template:', error);
        }
    }

    async fetchStyle() {
        try {
            // Create an array to store all stylesheets
            const stylesheets = [];
            
            // Load global styles
            const globalStyles = ['typography.css', 'icons.css'];
            
            for (const style of globalStyles) {
                const response = await fetch(`../../renderer/styles/${style}`);
                const text = await response.text();
                const stylesheet = new CSSStyleSheet();
                await stylesheet.replace(text);
                stylesheets.push(stylesheet);
            }
            
            // Load component-specific style
            const componentStyleResponse = await fetch(`../../renderer/components/${this.constructor.name}/style.css`);
            const componentStyleText = await componentStyleResponse.text();
            const componentStyleSheet = new CSSStyleSheet();
            await componentStyleSheet.replace(componentStyleText);
            stylesheets.push(componentStyleSheet);
            
            if (this.shadowRoot) {
                this.shadowRoot.adoptedStyleSheets = stylesheets;
            }
        } catch (error) {
            console.error('Error loading styles:', error);
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

    async showDialog(vertex) {
        console.log(`%c # showDialog(${vertex._uuid})`, 'color: lightblue');

        try {
            const graphData = await window.api_internal.getGraphData();
            this.currentLanguage = graphData.languages.default;
        } catch (error) {
            console.error('Error fetching graph data:', error);
        }

        // get vertex content
        try {
            const vertexContent = await window.api_internal.vertexGetContent(vertex._uuid);
            const elContent = this.shadowRoot.querySelector('#content');
            elContent.innerHTML = vertexContent[this.currentLanguage];
        } catch (error) {
            console.error('Error fetching vertex:', error);
        }

        const vertexTitle = this.shadowRoot.querySelector('h1');
        vertexTitle.textContent = vertex._title[this.currentLanguage];
        this.dialog.showModal();

        const vertexPath = this.shadowRoot.querySelector('#path');
        vertexPath.textContent = `path: ${vertex.path}`;
    }

    closeDialog() {
        this.dialog.close();
    }
}

customElements.define('wc-vertex-preview', wcVertexPreview);